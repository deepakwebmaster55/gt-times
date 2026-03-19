(() => {
  const statusEl = document.querySelector("[data-payments-status]");
  const listEl = document.querySelector("[data-payments-list]");

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
    const [{ data: payments }, { data: bookings }] = await Promise.all([
      client.from("payments").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
      client.from("bookings").select("id, order_number, status").eq("user_id", session.user.id)
    ]);

    const bookingMap = new Map((bookings || []).map((booking) => [booking.id, booking]));

    if (!listEl) return;
    listEl.innerHTML = "";

    if (!(payments || []).length) {
      listEl.innerHTML = `<div class="account-card"><p class="empty-note">No payments yet.</p></div>`;
      return;
    }

    (payments || []).forEach((payment) => {
      const booking = bookingMap.get(payment.booking_id) || {};
      const card = document.createElement("article");
      card.className = "account-card booking-card";
      card.innerHTML = `
        <div class="account-header">
          <div>
            <h3>${payment.transaction_id || "Transaction"}</h3>
            <p class="small">${formatDate(payment.created_at)}</p>
          </div>
          <div class="booking-amount">${formatPrice(payment.amount)}</div>
        </div>
        <div class="booking-meta-row">
          <span class="status-pill ${window.GTTracking?.getPaymentBadgeClass(payment.status) || "pending"}">${window.GTTracking?.getPaymentLabel(payment.status) || payment.status || "Payment Pending"}</span>
          <span class="status-pill ${window.GTTracking?.getOrderBadgeClass(booking.status) || "pending"}">${window.GTTracking?.getOrderLabel(booking.status) || booking.status || "Pending"}</span>
        </div>
        <p class="small">Order: ${booking.order_number || "Linked order unavailable"}</p>
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
