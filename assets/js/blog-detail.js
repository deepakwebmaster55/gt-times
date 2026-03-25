(() => {
  const titleEl = document.querySelector("[data-blog-title]");
  const dateEl = document.querySelector("[data-blog-date]");
  const imageEl = document.querySelector("[data-blog-image]");
  const summaryEl = document.querySelector("[data-blog-summary]");
  const statusEl = document.querySelector("[data-blog-status]");

  const setStatus = (message, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.style.color = isError ? "#c13a2e" : "";
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString();
    } catch (_error) {
      return "";
    }
  };

  const renderBlog = (blog) => {
    if (!blog) {
      if (titleEl) titleEl.textContent = "Blog Not Found";
      if (dateEl) dateEl.textContent = "";
      if (summaryEl) summaryEl.textContent = "The blog entry is missing or inactive.";
      if (imageEl) {
        imageEl.removeAttribute("src");
        imageEl.setAttribute("alt", "Blog not found");
        imageEl.style.display = "none";
      }
      setStatus("Please open this page from a valid blog card.", true);
      return;
    }

    if (titleEl) titleEl.textContent = blog.title || "Blog";
    if (dateEl) dateEl.textContent = formatDate(blog.published_at);
    if (summaryEl) summaryEl.textContent = blog.summary || "";
    if (imageEl) {
      const rawImage = String(blog.image_url || "").trim().replace(/^['"]|['"]$/g, "");
      const image = (() => {
        if (!rawImage) return "";
        if (/^https?:\/\//i.test(rawImage) || rawImage.startsWith("data:")) return rawImage;
        const supabase2Url = window.GT_CONFIG?.supabase2?.url || "";
        if (!supabase2Url) return "";
        const base = supabase2Url.replace(/\/+$/, "");
        if (rawImage.startsWith("/storage/v1/object/public/")) return `${base}${rawImage}`;
        if (rawImage.startsWith("storage/v1/object/public/")) return `${base}/${rawImage}`;
        if (rawImage.startsWith("product-images/")) return `${base}/storage/v1/object/public/${rawImage}`;
        if (rawImage.startsWith("/product-images/")) return `${base}/storage/v1/object/public${rawImage}`;
        if (rawImage.startsWith("blogs/")) return `${base}/storage/v1/object/public/product-images/${rawImage}`;
        if (rawImage.startsWith("/blogs/")) return `${base}/storage/v1/object/public/product-images${rawImage}`;
        if (rawImage.startsWith("/")) return `${base}${rawImage}`;
        return `${base}/storage/v1/object/public/product-images/${rawImage}`;
      })();
      if (image) {
        imageEl.setAttribute("src", image);
        imageEl.setAttribute("alt", blog.title || "Blog");
        imageEl.onerror = () => {
          imageEl.onerror = null;
          imageEl.style.display = "none";
        };
        imageEl.style.display = "block";
      } else {
        imageEl.style.display = "none";
      }
    }
    setStatus("");
  };

  const boot = () => {
    const ready = window.GT_DATA_READY;
    if (ready && typeof ready.finally === "function") {
      ready.finally(() => renderBlog(window.GT_BLOG_DETAIL || null));
      return;
    }
    renderBlog(window.GT_BLOG_DETAIL || null);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
