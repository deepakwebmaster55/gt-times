const ensureLoader = () => {
  let loader = document.querySelector(".gt-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.className = "gt-loader";
    loader.innerHTML = `
      <div class="loader-brand" aria-label="Loading">
        <div class="loader-logo-wrap">
          <img class="loader-logo" src="assets/images/logo.svg" alt="Glamtreasure logo" />
        </div>
        <p class="loader-text">Loading Glamtreasure</p>
      </div>
    `;
    document.documentElement.appendChild(loader);
  }
  return loader;
};

const setLoading = (isLoading) => {
  if (isLoading) {
    document.documentElement.classList.remove("gt-site-ready");
  } else {
    document.documentElement.classList.add("gt-site-ready");
  }
  const loader = ensureLoader();
  loader.classList.toggle("hidden", !isLoading);
};

setLoading(true);

setTimeout(() => {
  document.documentElement.classList.add("gt-site-ready");
}, 4000);

window.addEventListener("load", () => setLoading(false));
