(() => {
  const pageRoot = document.querySelector("[data-search-page]");
  const form = document.querySelector("[data-search-form]");
  const input = document.querySelector("[data-search-input]");
  const summary = document.querySelector("[data-search-summary]");
  const resultsRoot = document.querySelector("[data-search-results]");
  const suggestionsRoot = document.querySelector("[data-search-suggestions]");
  const popularRoot = document.querySelector("[data-search-popular]");

  if (!pageRoot || !form || !input || !summary || !resultsRoot) return;

  const normalizeImages = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        return trimmed
          .slice(1, -1)
          .split(",")
          .map((item) => item.replace(/^\"|\"$/g, "").trim())
          .filter(Boolean);
      }
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          return [trimmed];
        }
      }
      return [trimmed];
    }
    return value ? [value] : [];
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

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

  const scoreText = (query, haystack) => {
    const source = String(haystack || "").toLowerCase();
    const q = String(query || "").toLowerCase().trim();
    if (!q || !source) return 0;
    if (source === q) return 150;
    if (source.startsWith(q)) return 90;
    if (source.includes(q)) return 60;
    const parts = q.split(/\s+/).filter(Boolean);
    return parts.reduce((total, part) => total + (source.includes(part) ? 16 : 0), 0);
  };

  const flattenValue = (value) => {
    if (value === null || value === undefined || value === false) return [];
    if (Array.isArray(value)) {
      return value.flatMap((item) => flattenValue(item));
    }
    if (typeof value === "object") {
      return Object.values(value).flatMap((item) => flattenValue(item));
    }
    const text = String(value).trim();
    return text ? [text] : [];
  };

  const getProducts = async () => {
    if (window.GT_DATA_READY && typeof window.GT_DATA_READY.then === "function") {
      try {
        await window.GT_DATA_READY;
      } catch (error) {
      }
    }
    return (window.GT_SEARCH_DATA && Array.isArray(window.GT_SEARCH_DATA.products))
      ? window.GT_SEARCH_DATA.products
      : [];
  };

  const getProductEntry = (product) => {
    const image = normalizeImages(product.images)[0] || "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200";
    const slugOrId = product.slug || product.id || "";
    const category = Array.isArray(product.category) ? product.category.join(", ") : (product.category || "");
    return {
      id: product.id || slugOrId,
      title: product.title || "Product",
      image,
      badge: product.badge || "Product",
      category,
      price: product.price ? `Rs. ${Number(product.price).toLocaleString()}` : "",
      oldPrice: product.old_price ? `Rs. ${Number(product.old_price).toLocaleString()}` : "",
      summary: product.short_desc || product.description || "View this product for more details.",
      url: `product-royal-crown-gold.html?watch=${encodeURIComponent(slugOrId)}`
    };
  };

  const scoreProduct = (query, product) => {
    const primaryScore =
      scoreText(query, product.title) * 4 +
      scoreText(query, product.short_desc) * 3 +
      scoreText(query, product.description) * 3 +
      scoreText(query, product.category) * 2;

    const allFieldScore = Object.entries(product || {}).reduce((total, [key, value]) => {
      const weight = key === "title"
        ? 0
        : key === "short_desc" || key === "description"
          ? 0
          : key === "category"
            ? 0
            : 1;
      if (!weight) return total;
      return total + flattenValue(value).reduce((sum, field) => sum + scoreText(query, field) * weight, 0);
    }, 0);

    return primaryScore + allFieldScore;
  };

  const renderPopular = async () => {
    if (!popularRoot) return;
    const products = await getProducts();
    const terms = Array.from(new Set(
      products
        .flatMap((product) => [
          ...flattenValue(product.category),
          ...flattenValue(product.badge),
          ...flattenValue(product.title)
        ])
        .filter(Boolean)
    )).slice(0, 6);

    if (!terms.length) {
      popularRoot.innerHTML = "";
      return;
    }

    popularRoot.innerHTML = `
      <span>Popular searches:</span>
      ${terms.map((term) => `<button type="button" class="search-chip" data-search-chip="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join("")}
    `;

    popularRoot.querySelectorAll("[data-search-chip]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-search-chip") || "";
        input.value = value;
        hideSuggestions();
        renderResults(value);
      });
    });
  };

  const hideSuggestions = () => {
    if (!suggestionsRoot) return;
    suggestionsRoot.hidden = true;
    suggestionsRoot.innerHTML = "";
  };

  const renderSuggestions = async (query) => {
    if (!suggestionsRoot) return;
    const trimmed = String(query || "").trim();
    if (!trimmed) {
      hideSuggestions();
      return;
    }

    const products = await getProducts();
    const suggestions = products
      .map((product) => ({ product, score: scoreProduct(trimmed, product) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => getProductEntry(item.product));

    if (!suggestions.length) {
      hideSuggestions();
      return;
    }

    suggestionsRoot.hidden = false;
    suggestionsRoot.innerHTML = suggestions.map((item) => `
      <button type="button" class="search-suggestion" data-search-suggestion="${escapeHtml(item.title)}">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" />
        <span class="search-suggestion-copy">
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.category || item.badge)}</small>
        </span>
      </button>
    `).join("");

    suggestionsRoot.querySelectorAll("[data-search-suggestion]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-search-suggestion") || "";
        input.value = value;
        hideSuggestions();
        renderResults(value);
      });
    });
  };

  const renderResults = async (rawQuery) => {
    const query = String(rawQuery || "").trim();
    input.value = query;
    updateQuery(query);

    const products = await getProducts();
    if (!query) {
      summary.textContent = "Start typing to search products. Matching items will appear here.";
      resultsRoot.innerHTML = `<p class="search-empty-state">Search by product name, category, or collection to see matching products.</p>`;
      return;
    }

    const matches = products
      .map((product) => ({ product, score: scoreProduct(query, product) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => getProductEntry(item.product));

    summary.textContent = matches.length
      ? `${matches.length} product${matches.length === 1 ? "" : "s"} found for "${query}".`
      : `No products found for "${query}".`;

    if (!matches.length) {
      resultsRoot.innerHTML = `<p class="search-empty-state">No matching products are available right now. Try a different product name or category.</p>`;
      return;
    }

    resultsRoot.innerHTML = matches.map((item) => `
      <article class="product-card reveal">
        <div class="product-thumb">
          <span class="product-tag">${escapeHtml(item.badge)}</span>
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" />
        </div>
        <div class="product-content">
          <h3 class="product-title">${escapeHtml(item.title)}</h3>
          <div class="price">
            <strong>${escapeHtml(item.price)}</strong>
            <span>${escapeHtml(item.oldPrice)}</span>
          </div>
          <p class="rating">${escapeHtml(item.summary)}</p>
          <a class="btn btn-primary" href="${escapeHtml(item.url)}">View Product</a>
        </div>
      </article>
    `).join("");
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideSuggestions();
    renderResults(input.value);
  });

  input.addEventListener("input", () => {
    const value = input.value;
    renderSuggestions(value);
    renderResults(value);
  });

  input.addEventListener("focus", () => {
    renderSuggestions(input.value);
  });

  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) {
      hideSuggestions();
    }
  });

  renderPopular();
  renderResults(getQuery());
})();
