(() => {
  const statusEl = document.querySelector("[data-order-success-status]");
  const summaryEl = document.querySelector("[data-order-success-summary]");
  const itemsEl = document.querySelector("[data-order-success-items]");

  const setStatus = (message, isError) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", !!isError);
  };

  const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

  const launchBurst = () => {
    const wrap = document.querySelector("[data-burst-wrap]");
    if (!wrap) return;
    wrap.innerHTML = "";
    for (let i = 0; i < 28; i += 1) {
      const piece = document.createElement("span");
      piece.className = "burst-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      piece.style.background = ["#d4af37", "#0f3d91", "#2f87ff", "#ffffff"][i % 4];
      wrap.appendChild(piece);
    }
  };

  const load = async () => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("booking") || "";
    let successState = null;

    try {
      successState = JSON.parse(sessionStorage.getItem("gt_last_order_success") || "null");
    } catch (error) {
      successState = null;
    }

    if (!bookingId || !successState || successState.booking_id !== bookingId) {
      window.location.href = "account.html";
      return;
    }

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
    const [{ data: booking }, { data: items }, { data: payment }] = await Promise.all([
      client.from("bookings").select("*").eq("id", bookingId).eq("user_id", session.user.id).maybeSingle(),
      client.from("booking_items").select("*").eq("booking_id", bookingId).order("created_at", { ascending: true }),
      client.from("payments").select("*").eq("booking_id", bookingId).maybeSingle()
    ]);

    if (!booking) {
      setStatus("Order not found.", true);
      return;
    }

    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="booking-meta-row">
          <span class="status-pill success">Order Placed</span>
          <span class="status-pill ${window.GTTracking?.getPaymentBadgeClass(payment?.status) || "pending"}">${window.GTTracking?.getPaymentLabel(payment?.status) || "Payment Pending"}</span>
        </div>
        <div class="success-grid">
          <div><strong>Order Number</strong><p>${booking.order_number || "-"}</p></div>
          <div><strong>Total</strong><p>${formatPrice(booking.total_amount)}</p></div>
          <div><strong>Date</strong><p>${new Date(booking.created_at).toLocaleString()}</p></div>
          <div><strong>Status</strong><p>${window.GTTracking?.getOrderLabel(booking.status) || booking.status || "Pending"}</p></div>
        </div>
      `;
    }

    if (itemsEl) {
      itemsEl.innerHTML = (items || []).map((item) => `
        <div class="booking-item-row">
          <div>
            <strong>${item.title || "Item"}</strong>
            <p class="small">Qty ${item.quantity || 1}</p>
          </div>
          <div>${formatPrice((item.price || 0) * (item.quantity || 1))}</div>
        </div>
      `).join("");
    }

    launchBurst();
    setTimeout(() => {
      try {
        sessionStorage.removeItem("gt_last_order_success");
      } catch (error) {
      }
    }, 2000);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
