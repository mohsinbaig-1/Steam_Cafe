const historyList = document.getElementById("order-history-list");
const emptyHistory = document.getElementById("empty-history");

let savedOrders = [];
try {
    const value = JSON.parse(localStorage.getItem("steamCafeOrders"));
    savedOrders = Array.isArray(value) ? value : [];
} catch (error) {
    console.error("Unable to read saved orders.", error);
}

function money(value) {
    return `Rs. ${Number(value || 0).toLocaleString()}`;
}

if (savedOrders.length > 0) {
    emptyHistory.hidden = true;
    savedOrders.slice().reverse().forEach(order => {
        const card = document.createElement("article");
        card.className = "history-card";
        const heading = document.createElement("div");
        heading.className = "history-card-heading";
        const id = document.createElement("h2");
        id.textContent = order.id;
        const status = document.createElement("span");
        status.textContent = order.status || "Pending";
        heading.append(id, status);
        const details = document.createElement("p");
        details.textContent = `${order.items.length} item${order.items.length === 1 ? "" : "s"} · ${order.fulfillment?.type === "pickup" ? "Pickup" : "Delivery"}`;
        const total = document.createElement("strong");
        total.textContent = money(order.total);
        card.append(heading, details, total);
        historyList.appendChild(card);
    });
}
