(() => {
  const config = window.GT_CONFIG || {};
  const supabaseConfig = config.supabase3 || {};
  const hasSupabase = !!(window.supabase && supabaseConfig.url && supabaseConfig.anonKey);
  const client = hasSupabase
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      })
    : null;
  const localKey = "gt_cart";

  const readLocalCart = () => {
    try {
      const raw = localStorage.getItem(localKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const writeLocalCart = (items) => {
    localStorage.setItem(localKey, JSON.stringify(items));
  };

  const stableStringify = (value) => {
    if (!value || typeof value !== "object") return JSON.stringify(value || {});
    if (Array.isArray(value)) return JSON.stringify(value.map((item) => stableStringify(item)));
    const keys = Object.keys(value).sort();
    const sorted = {};
    keys.forEach((key) => {
      sorted[key] = value[key];
    });
    return JSON.stringify(sorted);
  };

  const getOptionsKey = (options) => {
    const normalized = options && typeof options === "object" ? options : {};
    return stableStringify(normalized);
  };

  const sumCount = (items) => items.reduce((total, item) => total + Number(item.quantity || 0), 0);

  const updateHeaderCount = (count) => {
    const links = Array.from(document.querySelectorAll(".header-actions a"));
    const cartLink = links.find((link) => (link.textContent || "").toLowerCase().includes("cart"));
    if (cartLink) {
      cartLink.textContent = `Cart (${count})`;
    }
  };

  const getSession = async () => {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session || null;
  };

  const loadCartFromDb = async (session) => {
    const { data, error } = await client
      .from("cart_items")
      .select("id, product_id, title, price, image_url, quantity, options, options_key")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });
    return { data: data || [], error };
  };

  const loadCart = async () => {
    const session = await getSession();
    if (session && client) {
      const localFallback = readLocalCart();
      const { data: items, error } = await loadCartFromDb(session);
      if (error) {
        updateHeaderCount(sumCount(localFallback));
        return localFallback;
      }
      if (!items.length && localFallback.length) {
        updateHeaderCount(sumCount(localFallback));
        // Try to merge local cart silently.
        mergeLocalToDb(session);
        return localFallback;
      }
      const localItems = items.map((item) => ({
        local_id: item.id,
        product_id: item.product_id,
        title: item.title,
        price: item.price,
        image_url: item.image_url,
        quantity: item.quantity,
        options: item.options,
        options_key: item.options_key
      }));
      writeLocalCart(localItems);
      updateHeaderCount(sumCount(localItems));
      return localItems;
    }
    const localItems = readLocalCart();
    updateHeaderCount(sumCount(localItems));
    return localItems;
  };

  const addToCartLocal = (item) => {
    const items = readLocalCart();
    const match = items.find((existing) =>
      existing.product_id === item.product_id &&
      (existing.options_key || "") === (item.options_key || "")
    );
    if (match) {
      match.quantity += item.quantity;
    } else {
      items.push({
        ...item,
        local_id: item.local_id || `local_${Date.now()}_${Math.random().toString(16).slice(2)}`
      });
    }
    writeLocalCart(items);
    updateHeaderCount(sumCount(items));
    return items;
  };

  const addToCartDb = async (session, item) => {
    const { data: existing, error: existingError } = await client
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", session.user.id)
      .eq("product_id", item.product_id)
      .eq("options_key", item.options_key || "")
      .maybeSingle();

    if (existingError) {
      return { error: existingError };
    }

    if (existing && existing.id) {
      const { data, error } = await client
        .from("cart_items")
        .update({ quantity: Number(existing.quantity || 0) + Number(item.quantity || 1) })
        .eq("id", existing.id)
        .select()
        .maybeSingle();
      return { data, error };
    }

    const { data, error } = await client
      .from("cart_items")
      .insert({
        user_id: session.user.id,
        product_id: item.product_id,
        title: item.title,
        price: item.price,
        image_url: item.image_url,
        quantity: item.quantity,
        options: item.options,
        options_key: item.options_key || ""
      })
      .select()
      .maybeSingle();
    return { data, error };
  };

  const addToCart = async (item) => {
    const normalized = {
      product_id: String(item.product_id || ""),
      title: item.title || "",
      price: Number(item.price || 0),
      image_url: item.image_url || "",
      quantity: Math.max(1, Number(item.quantity || 1)),
      options: item.options || {},
      options_key: getOptionsKey(item.options || {})
    };

    const session = await getSession();
    if (session && client) {
      const { error } = await addToCartDb(session, normalized);
      if (error) {
        console.warn("Cart insert failed, falling back to local cart.", error);
        addToCartLocal(normalized);
        return { ok: false, error };
      }
      await loadCart();
      return { ok: true };
    } else {
      addToCartLocal(normalized);
      return { ok: true };
    }
  };

  const isLocalKey = (value) => String(value || "").startsWith("local_");

  const updateCartItem = async (idOrKey, changes) => {
    const session = await getSession();
    const updates = { quantity: Math.max(1, Number(changes.quantity || 1)) };

    if (session && client && !isLocalKey(idOrKey)) {
      await client.from("cart_items").update(updates).eq("id", idOrKey);
      await loadCart();
      return;
    }

    const items = readLocalCart();
    const item = items.find((entry) => entry.local_id === idOrKey);
    if (item) {
      item.quantity = updates.quantity;
      writeLocalCart(items);
      updateHeaderCount(sumCount(items));
    }
  };

  const removeCartItem = async (idOrKey) => {
    const session = await getSession();
    if (session && client && !isLocalKey(idOrKey)) {
      await client.from("cart_items").delete().eq("id", idOrKey);
      await loadCart();
      return;
    }

    const items = readLocalCart().filter((entry) => entry.local_id !== idOrKey);
    writeLocalCart(items);
    updateHeaderCount(sumCount(items));
  };

  const mergeLocalToDb = async (session) => {
    const items = readLocalCart();
    if (!items.length || !session || !client) return;
    for (const item of items) {
      await addToCartDb(session, {
        ...item,
        options_key: getOptionsKey(item.options || {})
      });
    }
    writeLocalCart([]);
    await loadCart();
  };

  const init = () => {
    loadCart();
    if (!client) return;
    client.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await mergeLocalToDb(session);
      }
      await loadCart();
    });
  };

  window.GTStore = {
    client,
    getSession,
    loadCart,
    addToCart,
    updateCartItem,
    removeCartItem
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
