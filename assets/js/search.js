(() => {
  const pageRoot = document.querySelector("[data-search-page]");
  const form = document.querySelector("[data-search-form]");
  const input = document.querySelector("[data-search-input]");
  const summary = document.querySelector("[data-search-summary]");
  const resultsRoot = document.querySelector("[data-search-results]");
  const suggestionsRoot = document.querySelector("[data-search-suggestions]");
  const popularRoot = document.querySelector("[data-search-popular]");
  const helperText = document.querySelector("[data-search-helper-text]");
  const correctionNote = document.querySelector("[data-search-correction]");
  const sortSelect = document.querySelector("[data-search-sort]");
  const appliedRoot = document.querySelector("[data-search-applied]");
  const priceMinInput = document.querySelector("[data-filter-price-min]");
  const priceMaxInput = document.querySelector("[data-filter-price-max]");
  const genderSelect = document.querySelector("[data-filter-gender-select]");
  const categorySelect = document.querySelector("[data-filter-category-select]");
  const brandInput = document.querySelector("[data-filter-brand-input]");
  const brandOptions = document.querySelector("#search-brand-options");
  const applyButton = document.querySelector("[data-search-apply]");
  const resetButton = document.querySelector("[data-search-reset]");

  if (!pageRoot || !form || !input || !summary || !resultsRoot || !suggestionsRoot) return;

  const state = {
    host: "",
    index: "products",
    searchKey: "",
    initialized: false,
    currentQuery: "",
    selectedCategory: "",
    selectedBrand: "",
    selectedGender: "",
    priceMin: "",
    priceMax: "",
    sort: "relevance"
  };
  const aiSuggestionCache = new Map();
  let suggestionRequestId = 0;

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const debounce = (fn, delay = 300) => {
    let timer = 0;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  };

  const formatPrice = (value) => {
    const amount = Number(value || 0);
    return `Rs. ${amount.toLocaleString()}`;
  };

  const getQuery = () => new URLSearchParams(window.location.search).get("q") || "";

  const updateQuery = (query) => {
    const url = new URL(window.location.href);
    if (query) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState({}, "", url.toString());
  };

  const normalizeHost = (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
    return `https://${trimmed.replace(/\/+$/, "")}`;
  };

  const normalizeImage = (item) =>
    item.image || "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200";

  const levenshtein = (a, b) => {
    const left = String(a || "");
    const right = String(b || "");
    const dp = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

    for (let i = 0; i <= left.length; i += 1) dp[i][0] = i;
    for (let j = 0; j <= right.length; j += 1) dp[0][j] = j;

    for (let i = 1; i <= left.length; i += 1) {
      for (let j = 1; j <= right.length; j += 1) {
        const cost = left[i - 1] === right[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    return dp[left.length][right.length];
  };

  const getVocabulary = () => {
    const products = (window.GT_PRODUCTS || []).slice(0, 100);
    const seeded = [
      "watch",
      "watches",
      "perfume",
      "perfumes",
      "handbag",
      "handbags",
      "luxury",
      "silver",
      "gold",
      "women",
      "men",
      "bestseller",
      "featured",
      "new"
    ];

    const dynamic = products.flatMap((item) => [
      item.title,
      item.subtitle,
      item.badge,
      item.category,
      item.slug
    ]);

    return Array.from(new Set(
      [...seeded, ...dynamic]
        .flatMap((value) => String(value || "").toLowerCase().split(/[^a-z0-9]+/))
        .filter((term) => term.length >= 3)
    ));
  };

  const hasCatalogMatch = (token) => {
    const lower = String(token || "").toLowerCase().trim();
    if (!lower) return false;

    const products = Array.isArray(window.GT_PRODUCTS) ? window.GT_PRODUCTS : [];
    return products.some((item) => {
      const haystacks = [
        item.title,
        item.subtitle,
        item.category,
        item.badge,
        item.slug,
        item.short_desc,
        item.description
      ].flatMap((value) => String(value || "").toLowerCase().split(/[^a-z0-9]+/));

      return haystacks.includes(lower);
    });
  };

  const correctTypos = (value) => {
    const vocabulary = getVocabulary();
    const original = String(value || "").trim();
    const corrected = original
      .split(/\s+/)
      .map((token) => {
        const lower = token.toLowerCase();
        if (lower.length < 3 || /^\d+$/.test(lower)) return token;
        if (hasCatalogMatch(lower)) return token;

        const prefixMatches = vocabulary
          .filter((candidate) => candidate.startsWith(lower))
          .sort((left, right) => left.length - right.length || left.localeCompare(right));

        if (prefixMatches.length) {
          return prefixMatches[0];
        }

        let best = lower;
        let bestDistance = Infinity;

        vocabulary.forEach((candidate) => {
          const distance = levenshtein(lower, candidate);
          const maxDistance = lower.length <= 4 ? 1 : 1;
          if (distance <= maxDistance && distance < bestDistance) {
            best = candidate;
            bestDistance = distance;
          }
        });

        return best;
      })
      .join(" ")
      .trim();

    return {
      corrected,
      changed: corrected.toLowerCase() !== original.toLowerCase()
    };
  };

  const parseSmartQuery = (rawQuery) => {
    const typoResult = correctTypos(String(rawQuery || "").trim());
    let query = typoResult.corrected;
    const filters = [];
    const applied = [];
    let gender = "";

    const genderMatchers = [
      { regex: /\b(men|man|male|boys?)\b/i, value: "men" },
      { regex: /\b(women|woman|female|girls?)\b/i, value: "women" },
      { regex: /\bunisex\b/i, value: "unisex" }
    ];

    genderMatchers.forEach((entry) => {
      if (entry.regex.test(query)) {
        gender = entry.value;
        query = query.replace(entry.regex, " ").replace(/\s+/g, " ").trim();
      }
    });

    if (gender) {
      filters.push(`gender = "${gender}"`);
      applied.push({ type: "Gender", value: gender });
    }

    const under = query.match(/\b(?:under|below|less than|max)\s+(\d+(?:\.\d+)?)\b/i);
    if (under) {
      filters.push(`price <= ${Number(under[1])}`);
      applied.push({ type: "Price", value: `Under ${formatPrice(under[1])}` });
      query = query.replace(under[0], " ").replace(/\s+/g, " ").trim();
    }

    const above = query.match(/\b(?:above|over|greater than|min)\s+(\d+(?:\.\d+)?)\b/i);
    if (above) {
      filters.push(`price >= ${Number(above[1])}`);
      applied.push({ type: "Price", value: `Above ${formatPrice(above[1])}` });
      query = query.replace(above[0], " ").replace(/\s+/g, " ").trim();
    }

    const between = query.match(/\bbetween\s+(\d+(?:\.\d+)?)\s+(?:and|to)\s+(\d+(?:\.\d+)?)\b/i);
    if (between) {
      filters.push(`price >= ${Number(between[1])}`);
      filters.push(`price <= ${Number(between[2])}`);
      applied.push({ type: "Price", value: `${formatPrice(between[1])} - ${formatPrice(between[2])}` });
      query = query.replace(between[0], " ").replace(/\s+/g, " ").trim();
    }

    return { query, filters, applied, typoCorrection: typoResult };
  };

  const getSelectedFilters = () => {
    const filters = [];
    const applied = [];
    const pushTextFilter = (field, value, label) => {
      if (!value) return;
      filters.push(`${field} = "${String(value).replace(/"/g, '\\"')}"`);
      applied.push({ type: label, value });
    };

    pushTextFilter("gender", state.selectedGender, "Gender");
    pushTextFilter("category", state.selectedCategory, "Category");

    if (state.priceMin !== "") {
      filters.push(`price >= ${Number(state.priceMin)}`);
      applied.push({ type: "Min", value: formatPrice(state.priceMin) });
    }

    if (state.priceMax !== "") {
      filters.push(`price <= ${Number(state.priceMax)}`);
      applied.push({ type: "Max", value: formatPrice(state.priceMax) });
    }

    return { filters, applied };
  };

  const getBrandTextMatches = (hits) => {
    const brandText = String(state.selectedBrand || "").trim().toLowerCase();
    if (!brandText) return hits;

    return (hits || []).filter((item) => {
      const haystack = [
        item.title,
        item.subtitle,
        item.short_desc,
        item.description,
        item.brand,
        item.category
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return haystack.includes(brandText);
    });
  };

  const buildSearchPayload = (rawQuery, options = {}) => {
    const parsed = parseSmartQuery(rawQuery);
    const selected = getSelectedFilters();
    const filters = [...parsed.filters, ...selected.filters];

    return {
      request: {
        q: parsed.query,
        filter: filters.length ? filters.join(" AND ") : undefined,
        limit: options.limit || 10,
        sort: state.sort !== "relevance" ? [state.sort] : undefined,
        attributesToHighlight: ["title", "subtitle", "category", "badge", "short_desc", "description"],
        highlightPreTag: "__hl__",
        highlightPostTag: "__/hl__",
        facets: ["category", "brand", "gender"]
      },
      correction: parsed.typoCorrection
    };
  };

  const meiliSearch = async (payload) => {
    if (!state.initialized) {
      await initSearch();
    }

    const response = await fetch(`${state.host}/indexes/${state.index}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.searchKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Search request failed");
    }

    return await response.json();
  };

  const getFunctionBaseUrl = () => {
    const supabaseConfig = (window.GT_CONFIG && window.GT_CONFIG.supabase1) || {};
    return `${String(supabaseConfig.url || "").replace(/\/+$/, "")}/functions/v1/product-search`;
  };

  const initSearch = async () => {
    if (state.initialized) return;

    const supabaseConfig = (window.GT_CONFIG && window.GT_CONFIG.supabase1) || {};
    const response = await fetch(getFunctionBaseUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseConfig.anonKey || ""
      },
      body: JSON.stringify({ action: "public_config" })
    });

    if (!response.ok) {
      throw new Error("Unable to load public search configuration.");
    }

    const payload = await response.json();
    state.host = normalizeHost(payload.host);
    state.index = payload.index || "products";
    state.searchKey = payload.searchKey || "";
    state.initialized = Boolean(state.host && state.searchKey);

    if (!state.initialized) {
      throw new Error("Incomplete public search configuration.");
    }
  };

  const fetchAiSuggestions = async (query) => {
    const trimmed = String(query || "").trim().toLowerCase();
    if (trimmed.length < 4) return [];
    if (aiSuggestionCache.has(trimmed)) return aiSuggestionCache.get(trimmed);

    const request = fetch(getFunctionBaseUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "suggest_ai",
        query: trimmed
      })
    })
      .then((response) => response.ok ? response.json() : { suggestions: [] })
      .then((payload) => Array.isArray(payload.suggestions) ? payload.suggestions : [])
      .catch(() => []);

    aiSuggestionCache.set(trimmed, request);
    return request;
  };

  const renderPopular = () => {
    const suggestions = [
      "watch under 500",
      "women watch",
      "men perfume above 1000",
      "luxury handbag",
      "silver watch",
      "brand fossil"
    ];

    popularRoot.innerHTML = `
      <span>Popular searches:</span>
      ${suggestions.map((term) => `<button type="button" class="search-chip" data-search-chip="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join("")}
    `;

    popularRoot.querySelectorAll("[data-search-chip]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-search-chip") || "";
        input.value = value;
        hideSuggestions();
        runSearch(value);
      });
    });
  };

  const hideSuggestions = () => {
    suggestionsRoot.hidden = true;
    suggestionsRoot.innerHTML = "";
  };

  const highlightMatch = (value) =>
    escapeHtml(String(value || ""))
      .replace(/__hl__/g, "<mark>")
      .replace(/__\/hl__/g, "</mark>");

  const buildSmartSuggestions = (rawQuery) => {
    const trimmed = String(rawQuery || "").trim();
    if (!trimmed) return [];
    const parsed = parseSmartQuery(trimmed);
    const base = parsed.query || trimmed;
    const wordCount = base.split(/\s+/).filter(Boolean).length;
    const products = Array.isArray(window.GT_PRODUCTS) ? window.GT_PRODUCTS : [];
    const queryLower = base.toLowerCase();
    const conciseTerms = Array.from(new Set(
      products.flatMap((item) => [
        item.category,
        item.badge,
        ...(Array.isArray(item.colors) ? item.colors : [])
      ])
        .flatMap((value) => String(value || "").split(","))
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((value) => value.length <= 18)
        .filter((value) => /^[a-z0-9\s-]+$/i.test(value))
    )).filter((term) => term.toLowerCase() !== queryLower);

    const priceTerms = [
      `${base} under 500`,
      `${base} under 1000`,
      `${base} above 1000`
    ];

    const genderTerms = [
      `men ${base}`,
      `women ${base}`
    ];

    const intentTerms = [
      `${base} bestseller`,
      `${base} featured`
    ];

    const fieldTerms = conciseTerms.flatMap((term) => {
      const lower = term.toLowerCase();
      if (queryLower.includes(lower) || lower.includes(queryLower)) {
        return [];
      }
      return wordCount > 1 ? [`${base} ${term}`] : [`${term} ${base}`];
    });

    return Array.from(new Set(
      [...priceTerms, ...genderTerms, ...intentTerms, ...fieldTerms]
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => item.length <= 32)
        .filter((item) => item.split(/\s+/).length <= 5)
    )).slice(0, 6);
  };

  const renderSuggestionMenu = (smartSuggestions, hits) => {
    const titleSuggestions = Array.from(new Set(
      (hits || [])
        .map((item) => String(item.title || "").trim())
        .filter(Boolean)
    )).slice(0, 6);

    if (!titleSuggestions.length && !smartSuggestions.length) {
      hideSuggestions();
      return;
    }

    suggestionsRoot.hidden = false;
    suggestionsRoot.innerHTML = `
      ${smartSuggestions.map((item) => `
        <button type="button" class="search-suggestion search-suggestion-smart" data-search-suggestion="${escapeHtml(item)}">
          <span class="search-suggestion-icon">+</span>
          <span class="search-suggestion-copy">
            <strong>${escapeHtml(item)}</strong>
            <small>Smart suggestion</small>
          </span>
        </button>
      `).join("")}
      ${titleSuggestions.map((title) => {
        const item = (hits || []).find((entry) => String(entry.title || "").trim() === title) || {};
        return `
        <button type="button" class="search-suggestion search-suggestion-product" data-search-suggestion="${escapeHtml(title)}">
          <span class="search-suggestion-icon search-suggestion-icon-product">#</span>
          <span class="search-suggestion-copy">
            <strong>${highlightMatch(item._formatted?.title || title)}</strong>
            <small>${escapeHtml([item.subtitle, item.category, formatPrice(item.price)].filter(Boolean).join(" | "))}</small>
          </span>
        </button>
      `;
      }).join("")}
    `;

    suggestionsRoot.querySelectorAll("[data-search-suggestion]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-search-suggestion") || "";
        input.value = value;
        hideSuggestions();
        runSearch(value);
      });
    });
  };

  const renderSuggestions = async (query) => {
    const trimmed = String(query || "").trim();
    if (!trimmed) {
      hideSuggestions();
      return;
    }

    const requestId = ++suggestionRequestId;
    try {
      const payload = buildSearchPayload(trimmed, { limit: 5 });
      payload.request.limit = 8;
      const fallbackSuggestions = buildSmartSuggestions(trimmed);
      const response = await meiliSearch(payload.request);
      if (requestId !== suggestionRequestId || input.value.trim() !== trimmed) return;
      const hits = Array.isArray(response.hits) ? response.hits : [];
      renderSuggestionMenu(fallbackSuggestions, hits);

      fetchAiSuggestions(trimmed).then((aiSuggestions) => {
        if (requestId !== suggestionRequestId || input.value.trim() !== trimmed) return;
        if (Array.isArray(aiSuggestions) && aiSuggestions.length) {
          renderSuggestionMenu(aiSuggestions, hits);
        }
      });
    } catch (error) {
      hideSuggestions();
      if (helperText) {
        helperText.textContent = error instanceof Error ? error.message : "Suggestions are temporarily unavailable.";
      }
    }
  };

  const renderFilters = (response) => {
    if (genderSelect) {
      genderSelect.value = state.selectedGender || "";
    }

    if (categorySelect) {
      const categorySource = Array.isArray(window.GT_CATEGORIES) && window.GT_CATEGORIES.length
        ? window.GT_CATEGORIES.map((item) => item.name || item.slug || "")
        : (window.GT_PRODUCTS || []).flatMap((item) =>
            String(item.category || "")
              .split(",")
              .map((value) => value.trim())
          );
      const categories = Array.from(new Set(categorySource.filter(Boolean))).sort((a, b) => a.localeCompare(b));
      categorySelect.innerHTML = `
        <option value="">All categories</option>
        ${categories.map((category) => `<option value="${escapeHtml(category)}" ${state.selectedCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
      `;
    }

    if (brandOptions) {
      const brandSource = Array.from(new Set(
        (window.GT_PRODUCTS || []).flatMap((item) => [
          item.brand,
          item.title,
          item.subtitle
        ])
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      )).sort((a, b) => a.localeCompare(b));
      brandOptions.innerHTML = brandSource.map((brand) => `<option value="${escapeHtml(brand)}"></option>`).join("");
    }

    if (brandInput) {
      brandInput.value = state.selectedBrand || "";
    }
  };

  const renderInitialFilters = async () => {
    if (window.GT_DATA_READY && typeof window.GT_DATA_READY.then === "function") {
      try {
        await window.GT_DATA_READY;
      } catch (_error) {
      }
    }

    renderFilters({ facetDistribution: {} });
  };

  const renderAppliedFilters = (rawQuery) => {
    if (!appliedRoot) return;
    const parsed = parseSmartQuery(rawQuery);
    const selected = getSelectedFilters();
    const tags = [...parsed.applied, ...selected.applied];
    if (state.selectedBrand) {
      tags.push({ type: "Brand/Text", value: state.selectedBrand });
    }

    if (!tags.length) {
      appliedRoot.innerHTML = "";
      return;
    }

    appliedRoot.innerHTML = tags.map((tag) => `
      <span class="search-applied-chip">${escapeHtml(tag.type)}: ${escapeHtml(tag.value)}</span>
    `).join("");
  };

  const renderCorrectionNote = (rawQuery, correction) => {
    if (!correctionNote) return;
    const original = String(rawQuery || "").trim();

    if (!original || !correction?.changed || !correction.corrected) {
      correctionNote.hidden = true;
      correctionNote.textContent = "";
      return;
    }

    correctionNote.hidden = false;
    correctionNote.innerHTML = `Showing results for <strong>${escapeHtml(correction.corrected)}</strong>`;
  };

  const renderResults = (rawQuery, response) => {
    const sourceHits = Array.isArray(response.hits) ? response.hits : [];
    const hits = getBrandTextMatches(sourceHits);
    const total = hits.length;
    const hasActiveFilter = Boolean(
      state.selectedGender ||
      state.selectedCategory ||
      state.selectedBrand ||
      state.priceMin !== "" ||
      state.priceMax !== ""
    );

    summary.textContent = rawQuery
      ? `${total} product${total === 1 ? "" : "s"} found for "${rawQuery}".`
      : hasActiveFilter
        ? `${total} product${total === 1 ? "" : "s"} found for the selected filters.`
        : "Start typing to search products. Matching items will appear here.";

    renderAppliedFilters(rawQuery);
    renderFilters(response);

    if (!hits.length) {
      resultsRoot.innerHTML = `<p class="search-empty-state">No matching products are available right now. Try a different product name, brand, or price range.</p>`;
      return;
    }

    resultsRoot.innerHTML = hits.map((item) => `
      <article class="product-card is-visible">
        <a class="product-thumb" href="product-royal-crown-gold.html?watch=${encodeURIComponent(item.slug || item.id || "")}">
          <span class="product-tag">${escapeHtml(item.badge || item.category || "Product")}</span>
          <img src="${escapeHtml(normalizeImage(item))}" alt="${escapeHtml(item.title || "Product")}" />
        </a>
        <div class="product-content">
          <h3 class="product-title">${highlightMatch(item._formatted?.title || item.title)}</h3>
          ${item.subtitle ? `<p class="product-subtitle">${highlightMatch(item._formatted?.subtitle || item.subtitle)}</p>` : ""}
          <div class="price">
            <strong>${escapeHtml(formatPrice(item.price))}</strong>
            <span>${escapeHtml(item.old_price ? formatPrice(item.old_price) : (item.category || ""))}</span>
          </div>
          <p class="rating">${escapeHtml(item.short_desc || item.description || item.category || "View this product for more details.")}</p>
          <div class="search-result-meta">
            ${item.category ? `<span>${escapeHtml(item.category)}</span>` : ""}
            ${item.badge ? `<span>${escapeHtml(item.badge)}</span>` : ""}
            ${item.rating ? `<span>Rating ${escapeHtml(item.rating)}</span>` : ""}
            ${item.stock_status ? `<span>${escapeHtml(item.stock_status)}</span>` : ""}
            ${item.stock_quantity ? `<span>${escapeHtml(item.stock_quantity)} in stock</span>` : ""}
            ${Array.isArray(item.colors) && item.colors.length ? `<span>${escapeHtml(item.colors.join(", "))}</span>` : ""}
            ${item.brand ? `<span>${escapeHtml(item.brand)}</span>` : ""}
            ${item.gender ? `<span>${escapeHtml(item.gender)}</span>` : ""}
          </div>
          <a class="btn btn-primary" href="product-royal-crown-gold.html?watch=${encodeURIComponent(item.slug || item.id || "")}">View Product</a>
        </div>
      </article>
    `).join("");
  };

  const runSearch = async (rawQuery) => {
    const query = String(rawQuery || "").trim();
    state.currentQuery = query;
    input.value = query;
    updateQuery(query);

    try {
      const payload = buildSearchPayload(query, { limit: 12 });
      const response = await meiliSearch(payload.request);
      renderCorrectionNote(query, payload.correction);
      renderResults(query, response);
      if (helperText) {
        helperText.textContent = "Live Meilisearch results are active.";
      }
    } catch (error) {
      summary.textContent = "Search is temporarily unavailable.";
      resultsRoot.innerHTML = `<p class="search-empty-state">We could not load search results right now. Check the Meilisearch host, keys, and Supabase Edge Function env setup.</p>`;
      if (helperText) {
        helperText.textContent = error instanceof Error ? error.message : "Search is temporarily unavailable.";
      }
    }
  };

  const debouncedInput = debounce((value) => {
    renderSuggestions(value);
    runSearch(value);
  }, 120);

  const clearGroup = (selector, stateKey) => {
    const button = document.querySelector(selector);
    if (!button) return;
    button.addEventListener("click", () => {
      state[stateKey] = "";
      if (stateKey === "selectedGender" && genderSelect) genderSelect.value = "";
      if (stateKey === "selectedCategory" && categorySelect) categorySelect.value = "";
      if (stateKey === "selectedBrand" && brandInput) brandInput.value = "";
      runSearch(input.value);
    });
  };

  renderPopular();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideSuggestions();
    runSearch(input.value);
  });

  input.addEventListener("input", () => {
    debouncedInput(input.value);
  });

  input.addEventListener("focus", () => {
    renderSuggestions(input.value);
  });

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      state.sort = sortSelect.value || "relevance";
      runSearch(input.value);
    });
  }

  if (priceMinInput) {
    priceMinInput.addEventListener("change", () => {
      state.priceMin = priceMinInput.value || "";
      runSearch(input.value);
    });
  }

  if (priceMaxInput) {
    priceMaxInput.addEventListener("change", () => {
      state.priceMax = priceMaxInput.value || "";
      runSearch(input.value);
    });
  }

  clearGroup("[data-clear-gender]", "selectedGender");
  clearGroup("[data-clear-category]", "selectedCategory");
  clearGroup("[data-clear-brand]", "selectedBrand");

  if (genderSelect) {
    genderSelect.addEventListener("change", () => {
      state.selectedGender = genderSelect.value || "";
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      state.selectedCategory = categorySelect.value || "";
    });
  }

  if (brandInput) {
    brandInput.addEventListener("input", () => {
      state.selectedBrand = brandInput.value.trim();
    });
  }

  if (applyButton) {
    applyButton.addEventListener("click", () => {
      runSearch(input.value);
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      state.selectedCategory = "";
      state.selectedBrand = "";
      state.selectedGender = "";
      state.priceMin = "";
      state.priceMax = "";
      if (priceMinInput) priceMinInput.value = "";
      if (priceMaxInput) priceMaxInput.value = "";
      if (genderSelect) genderSelect.value = "";
      if (categorySelect) categorySelect.value = "";
      if (brandInput) brandInput.value = "";
      if (sortSelect) sortSelect.value = "relevance";
      state.sort = "relevance";
      runSearch(input.value);
    });
  }

  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) {
      hideSuggestions();
    }
  });

  initSearch()
    .then(async () => {
      await renderInitialFilters();
      return runSearch(getQuery());
    })
    .catch((error) => {
      summary.textContent = "Search is not configured yet.";
      resultsRoot.innerHTML = `<p class="search-empty-state">Configure the Supabase Edge Function env vars for Meilisearch and reload this page.</p>`;
      if (helperText) {
        helperText.textContent = error instanceof Error ? error.message : "Search configuration failed.";
      }
    });
})();
