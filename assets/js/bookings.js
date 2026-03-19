(() => {
  const statusEl = document.querySelector("[data-bookings-status]");
  const listEl = document.querySelector("[data-bookings-list]");

  const setStatus = (message, isError) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", !!isError);
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch (error) {
      return "";
    }
  };

  const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

  const renderTimeline = (status) => {
    const steps = window.GTTracking?.getTrackingSteps(status) || [];
    if (!steps.length) return "";
    return `
      <div class="tracking-timeline">
        ${steps.map((step) => `
          <div class="tracking-step${step.done ? " is-done" : ""}${step.active ? " is-active" : ""}">
            <span class="tracking-dot"></span>
            <span>${step.label}</span>
          </div>
        `).join("")}
      </div>
    `;
  };

  const load = async () => {
    if (!window.GTStore?.client) {
      setStatus("Store client missing.", true);
      return;
    }
    const session = await window.GTStore.getSession();
    if (!session) {
      window.location.href = "login.html";
      return;
    }

    const client = window.GTStore.client;
    const { data: bookings } = await client
      .from("bookings")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    const bookingIds = (bookings || []).map((booking) => booking.id);

    const [{ data: bookingItems }, { data: payments }] = await Promise.all([
      bookingIds.length
        ? client.from("booking_items").select("*").in("booking_id", bookingIds).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      client.from("payments").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false })
    ]);

    const itemMap = new Map();
    (bookingItems || []).forEach((item) => {
      const list = itemMap.get(item.booking_id) || [];
      list.push(item);
      itemMap.set(item.booking_id, list);
    });

    const paymentMap = new Map();
    (payments || []).forEach((payment) => {
      paymentMap.set(payment.booking_id, payment);
    });

    if (!listEl) return;
    listEl.innerHTML = "";

    if (!(bookings || []).length) {
      listEl.innerHTML = `<div class="account-card"><p class="empty-note">No bookings yet.</p></div>`;
      return;
    }

    (bookings || []).forEach((booking) => {
      const items = itemMap.get(booking.id) || [];
      const payment = paymentMap.get(booking.id) || {};
      const orderLabel = window.GTTracking?.getOrderLabel(booking.status) || booking.status || "Pending";
      const paymentLabel = window.GTTracking?.getPaymentLabel(payment.status) || payment.status || "Payment Pending";
      const card = document.createElement("article");
      card.className = "account-card booking-card";
      card.innerHTML = `
        <div class="account-header">
          <div>
            <h3>${booking.order_number || "Order"}</h3>
            <p class="small">${formatDate(booking.created_at)}</p>
          </div>
          <div class="booking-amount">${formatPrice(booking.total_amount)}</div>
        </div>
        <div class="booking-meta-row">
          <span class="status-pill ${window.GTTracking?.getOrderBadgeClass(booking.status) || "pending"}">${orderLabel}</span>
          <span class="status-pill ${window.GTTracking?.getPaymentBadgeClass(payment.status) || "pending"}">${paymentLabel}</span>
        </div>
        ${renderTimeline(booking.status)}
        <div class="booking-items">
          ${items.length ? items.map((item) => `
            <div class="booking-item-row">
              <div>
                <strong>${item.title || "Item"}</strong>
                <p class="small">Qty ${item.quantity || 1}</p>
              </div>
              <div>${formatPrice((item.price || 0) * (item.quantity || 1))}</div>
            </div>
          `).join("") : `<p class="small">Item details unavailable.</p>`}
        </div>
      `;
      listEl.appendChild(card);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
