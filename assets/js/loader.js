const ensureLoader = () => {
  let loader = document.querySelector(".gt-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.className = "gt-loader";
    loader.innerHTML = '<div class="spinner" aria-label="Loading"></div>';
    document.body.appendChild(loader);
  }
  return loader;
};

const setLoading = (isLoading) => {
  const loader = ensureLoader();
  loader.classList.toggle("hidden", !isLoading);
};

setLoading(true);


window.addEventListener("load", () => setLoading(false));
