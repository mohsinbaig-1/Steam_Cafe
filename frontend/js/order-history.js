const historyList = document.getElementById("order-history-list");
const emptyHistory = document.getElementById("empty-history");
const emptyTitle = document.getElementById("empty-title");
const emptyMessage = document.getElementById("empty-message");
const filterButtons = document.querySelectorAll(".filter-button");

let savedOrders = [];
let activeFilter = "all";

try {
    const storedOrders = JSON.parse(localStorage.getItem("steamCafeOrders"));
    savedOrders = Array.isArray(storedOrders)
        ? storedOrders.filter(order => order && typeof order === "object" && !Array.isArray(order))
        : [];
} catch (error) {
    console.error("Unable to read saved orders.", error);
}

function numberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function money(value) {
    return `Rs. ${numberValue(value).toLocaleString()}`;
}

function normalizeStatus(status) {
    const value = String(status || "Pending").trim().toLowerCase();
    if (value === "preparing") return "preparing";
    if (["completed", "delivered", "complete"].includes(value)) return "completed";
    if (["cancelled", "canceled", "cancel"].includes(value)) return "cancelled";
    return "pending";
}

function statusLabel(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function itemCount(items) {
    return items.reduce((total, item) => total + Math.max(0, numberValue(item.quantity)), 0);
}

function normalizedItems(order) {
    return Array.isArray(order.items)
        ? order.items.filter(item => item && typeof item === "object")
        : [];
}

function fulfillmentLabel(fulfillment) {
    return fulfillment && fulfillment.type === "pickup" ? "Pickup" : "Delivery";
}

function paymentLabel(paymentMethod) {
    const value = String(paymentMethod || "").trim();
    if (!value) return "Payment method unavailable";
    return value
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, character => character.toUpperCase());
}

function createInfoRow(label, value) {
    const row = document.createElement("div");
    row.className = "order-info-row";
    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    const valueElement = document.createElement("strong");
    valueElement.textContent = value;
    row.append(labelElement, valueElement);
    return row;
}

function createSummaryRow(label, value, isTotal) {
    const row = document.createElement("div");
    row.className = isTotal ? "summary-row total" : "summary-row";
    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    const valueElement = document.createElement("strong");
    valueElement.textContent = value;
    row.append(labelElement, valueElement);
    return row;
}

function createOrderCard(order) {
    const items = normalizedItems(order);
    const status = normalizeStatus(order.status);
    const fulfillmentType = fulfillmentLabel(order.fulfillment);
    const card = document.createElement("article");
    card.className = "order-card";

    const header = document.createElement("div");
    header.className = "order-card-header";
    const heading = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = order.id ? String(order.id) : "Order number unavailable";
    const date = document.createElement("p");
    date.className = "order-date";
    date.textContent = formatDate(order.createdAt);
    heading.append(title, date);
    const badge = document.createElement("span");
    badge.className = `status-badge ${status}`;
    badge.textContent = statusLabel(status);
    header.append(heading, badge);

    const summary = document.createElement("div");
    summary.className = "order-card-summary";
    const count = document.createElement("span");
    count.textContent = `${itemCount(items)} item${itemCount(items) === 1 ? "" : "s"}`;
    const method = document.createElement("span");
    method.textContent = fulfillmentType;
    const total = document.createElement("strong");
    total.className = "order-total";
    total.textContent = money(order.total);
    summary.append(count, method, total);

    const footer = document.createElement("div");
    footer.className = "order-card-footer";
    const footerText = document.createElement("span");
    footerText.textContent = "Order details";
    const detailsButton = document.createElement("button");
    detailsButton.className = "details-button";
    detailsButton.type = "button";
    detailsButton.setAttribute("aria-expanded", "false");
    detailsButton.textContent = "View Details";

    const details = document.createElement("div");
    details.className = "order-details";
    const itemsHeading = document.createElement("h4");
    itemsHeading.textContent = "Items";
    details.appendChild(itemsHeading);
    if (items.length === 0) {
        const unavailable = document.createElement("p");
        unavailable.className = "order-item-meta";
        unavailable.textContent = "Item information unavailable.";
        details.appendChild(unavailable);
    } else {
        items.forEach(item => {
            const itemRow = document.createElement("div");
            itemRow.className = "order-item";
            const itemInfo = document.createElement("div");
            const itemName = document.createElement("div");
            itemName.className = "order-item-name";
            itemName.textContent = item.name ? String(item.name) : "Unnamed item";
            const itemQuantity = document.createElement("div");
            itemQuantity.className = "order-item-meta";
            itemQuantity.textContent = `Qty: ${Math.max(0, numberValue(item.quantity))}`;
            itemInfo.append(itemName, itemQuantity);
            const itemPrice = document.createElement("strong");
            itemPrice.className = "order-item-price";
            itemPrice.textContent = money(numberValue(item.price) * numberValue(item.quantity));
            itemRow.append(itemInfo, itemPrice);
            details.appendChild(itemRow);
        });
    }

    const orderSummary = document.createElement("div");
    orderSummary.className = "order-summary";
    orderSummary.append(
        createSummaryRow("Subtotal", money(order.subtotal)),
        createSummaryRow("Delivery fee", money(order.deliveryFee)),
        createSummaryRow("Total", money(order.total), true)
    );
    details.appendChild(orderSummary);

    const orderInfo = document.createElement("div");
    orderInfo.className = "order-info";
    orderInfo.append(
        createInfoRow("Fulfillment", fulfillmentType),
        createInfoRow("Payment", paymentLabel(order.paymentMethod))
    );
    details.appendChild(orderInfo);

    detailsButton.addEventListener("click", () => {
        const expanded = card.classList.toggle("expanded");
        detailsButton.setAttribute("aria-expanded", String(expanded));
        detailsButton.textContent = expanded ? "Hide Details" : "View Details";
    });

    footer.append(footerText, detailsButton);
    card.append(header, summary, footer, details);
    return card;
}

function renderOrders() {
    const filteredOrders = activeFilter === "all"
        ? savedOrders
        : savedOrders.filter(order => normalizeStatus(order.status) === activeFilter);
    historyList.innerHTML = "";
    filteredOrders.slice().reverse().forEach(order => historyList.appendChild(createOrderCard(order)));
    emptyHistory.hidden = filteredOrders.length > 0;
    if (filteredOrders.length === 0) {
        const hasOrders = savedOrders.length > 0;
        emptyTitle.textContent = hasOrders ? "No matching orders" : "No orders yet";
        emptyMessage.textContent = hasOrders
            ? "Try another status filter to find your saved orders."
            : "Your orders will appear here after you place your first order.";
    }
}

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter || "all";
        filterButtons.forEach(filter => filter.classList.toggle("active", filter === button));
        renderOrders();
    });
});

renderOrders();
