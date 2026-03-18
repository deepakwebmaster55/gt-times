(() => {
  const form = document.querySelector("[data-search-form]");
  const input = document.querySelector("[data-search-input]");
  const summary = document.querySelector("[data-search-summary]");
  const resultsRoot = document.querySelector("[data-search-results]");

  if (!resultsRoot) return;

  const staticPages = [
    {
      type: "Page",
      title: "Home",
      summary: "Browse featured products, offers, reviews, and signature collections.",
      url: "index.html",
      keywords: "home featured products offers reviews collections"
    },
    {
      type: "Page",
      title: "Shop",
      summary: "Browse all watches and accessories with category filters.",
      url: "shop.html",
      keywords: "shop products watches shades handbags shoes perfumes jewelry belts wallets"
    },
    {
      type: "Page",
      title: "Categories",
      summary: "Explore product categories and discover collections faster.",
      url: "categories.html",
      keywords: "categories collections watches accessories"
    },
    {
      type: "Page",
      title: "About",
      summary: "Read about Glamtreasure, policies, support, and service values.",
      url: "about.html",
      keywords: "about company support service trust"
    },
    {
      type: "Page",
      title: "Contact",
      summary: "Get support for orders, gifting, and product questions.",
      url: "contact.html",
      keywords: "contact support order help phone email"
    },
    {
      type: "Page",
      title: "Blog",
      summary: "Read buying guides, style tips, and care advice.",
      url: "blog.html",
      keywords: "blog guides style care articles"
    },
    {
      type: "Page",
      title: "Help Center",
      summary: "Find store help, common questions, and order guidance.",
      url: "help-center.html",
      keywords: "help center faq support guidance"
    }
  ];

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

  const scoreText = (query, haystack) => {
    const source = String(haystack || "").toLowerCase();
    const q = String(query || "").toLowerCase().trim();
    if (!q || !source) return 0;
    if (source === q) return 120;
    if (source.startsWith(q)) return 80;
    if (source.includes(q)) return 50;
    const parts = q.split(/\s+/).filter(Boolean);
    if (!parts.length) return 0;
    return parts.reduce((total, part) => total + (source.includes(part) ? 12 : 0), 0);
  };

  const scoreEntry = (query, entry) => {
    let score = 0;
    score += scoreText(query, entry.title) * 3;
    score += scoreText(query, entry.summary) * 2;
    score += scoreText(query, entry.keywords);
    return score;
  };

  const toProductEntry = (product) => {
    const image = normalizeImages(product.images)[0] || "";
    return {
      section: "Products",
      type: "Product",
      title: product.title || "Product",
      summary: product.short_desc || product.description || "",
      url: `product-royal-crown-gold.html?watch=${encodeURIComponent(product.slug || product.id || "")}`,
      keywords: [
        product.badge,
        product.subtitle,
        product.category,
        product.slug,
        product.price
      ].join(" "),
      image
    };
  };

  const toCategoryEntry = (category) => ({
    section: "Categories",
    type: "Category",
    title: category.name || "Category",
    summary: category.description || "",
    url: `shop.html?category=${encodeURIComponent(category.slug || category.name || "")}`,
    keywords: [category.slug, category.name].join(" ")
  });

  const toBlogEntry = (blog) => ({
    section: "Blog",
    type: "Article",
    title: blog.title || "Blog article",
    summary: blog.summary || "",
    url: blog.url || `blog-${blog.slug}.html`,
    keywords: [blog.slug, blog.summary, blog.title].join(" ")
  });

  const toPageEntry = (page) => ({
    section: "Pages",
    type: page.type,
    title: page.title,
    summary: page.summary,
    url: page.url,
    keywords: page.keywords
  });

  const renderSection = (title, items) => {
    if (!items.length) return "";
    return `
      <section class="search-section-block">
        <div class="search-section-head">
          <h2>${escapeHtml(title)}</h2>
          <span>${items.length} result${items.length === 1 ? "" : "s"}</span>
        </div>
        <div class="search-hit-list">
          ${items.map((item) => `
            <article class="search-hit">
              <span class="search-hit-type">${escapeHtml(item.type)}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.summary || "Open this page to view more details.")}</p>
              <a class="link-inline" href="${escapeHtml(item.url)}">Open result</a>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  };

  const render = async () => {
    const query = getQuery().trim();
    if (input) input.value = query;

    if (!query) {
      if (summary) summary.textContent = "Search products, categories, blog posts, and key pages.";
      resultsRoot.innerHTML = `<p class="empty-note">Enter a search term to view results.</p>`;
      return;
    }

    if (window.GT_DATA_READY && typeof window.GT_DATA_READY.then === "function") {
      try {
        await window.GT_DATA_READY;
      } catch (error) {
      }
    }

    const searchData = window.GT_SEARCH_DATA || {};
    const products = (searchData.products || []).map(toProductEntry);
    const categories = (searchData.categories || []).map(toCategoryEntry);
    const blogs = (searchData.blogs || []).map(toBlogEntry);
    const pages = staticPages.map(toPageEntry);

    const allSections = [
      { title: "Products", items: products },
      { title: "Categories", items: categories },
      { title: "Blog", items: blogs },
      { title: "Pages", items: pages }
    ];

    const ranked = allSections.map((section) => {
      const items = section.items
        .map((item) => ({ ...item, score: scoreEntry(query, item) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      return { title: section.title, items };
    });

    const total = ranked.reduce((sum, section) => sum + section.items.length, 0);
    if (summary) {
      summary.textContent = total
        ? `${total} result${total === 1 ? "" : "s"} found for "${query}".`
        : `No results found for "${query}".`;
    }

    const html = ranked.map((section) => renderSection(section.title, section.items)).join("");
    resultsRoot.innerHTML = html || `<p class="empty-note">No matching products, categories, blog posts, or pages were found.</p>`;
  };

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = input ? input.value.trim() : "";
      const nextUrl = value ? `search.html?q=${encodeURIComponent(value)}` : "search.html";
      window.location.href = nextUrl;
    });
  }

  render();
})();
