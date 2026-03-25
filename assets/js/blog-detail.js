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

  const normalizeBlogImageValue = (rawImageValue) => {
    let value = "";
    if (rawImageValue && typeof rawImageValue === "object") {
      value = String(rawImageValue.publicUrl || rawImageValue.public_url || rawImageValue.url || "");
    } else {
      value = String(rawImageValue || "");
    }

    value = value.trim();
    if (!value) return "";

    if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === "string") value = parsed;
        if (parsed && typeof parsed === "object") {
          value = String(parsed.publicUrl || parsed.public_url || parsed.url || "");
        }
      } catch (_error) {}
    }

    return value.trim().replace(/^['"]|['"]$/g, "");
  };

  const getBlogImageCandidates = (rawImageValue) => {
    const value = normalizeBlogImageValue(rawImageValue);
    const candidates = [];
    const supabase2Base = (window.GT_CONFIG?.supabase2?.url || "").replace(/\/+$/, "");
    const supabase1Base = (window.GT_CONFIG?.supabase1?.url || "").replace(/\/+$/, "");
    if (!value) return candidates;
    if (/^https?:\/\//i.test(value) || value.startsWith("data:")) {
      candidates.push(value);
      if (
        supabase1Base &&
        supabase2Base &&
        value.startsWith(`${supabase2Base}/storage/v1/object/public/product-images/`)
      ) {
        candidates.push(value.replace(supabase2Base, supabase1Base));
      }
      return candidates;
    }

    const base = supabase2Base;
    const clean = value.replace(/^\/+/, "");

    if (base) {
      if (value.startsWith("/storage/v1/object/public/")) candidates.push(`${base}${value}`);
      if (clean.startsWith("storage/v1/object/public/")) candidates.push(`${base}/${clean}`);
      if (clean.startsWith("public/")) candidates.push(`${base}/storage/v1/object/${clean}`);
      if (clean.startsWith("product-images/")) candidates.push(`${base}/storage/v1/object/public/${clean}`);
      if (clean.startsWith("blogs/")) candidates.push(`${base}/storage/v1/object/public/product-images/${clean}`);
      candidates.push(`${base}/storage/v1/object/public/product-images/${clean}`);
      candidates.push(`${base}/storage/v1/object/public/${clean}`);
      candidates.push(`${base}/${clean}`);
    }

    candidates.push(value);
    return Array.from(new Set(candidates.filter(Boolean)));
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
      const candidates = getBlogImageCandidates(blog.image_url);
      let index = 0;
      const applyNext = () => {
        if (index < candidates.length) {
          imageEl.setAttribute("src", candidates[index]);
          return;
        }
        imageEl.setAttribute("src", "assets/images/logo.svg");
      };
      imageEl.setAttribute("alt", blog.title || "Blog");
      imageEl.onerror = () => {
        index += 1;
        applyNext();
      };
      applyNext();
      imageEl.style.display = "block";
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
