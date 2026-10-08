/* =========================================
   STEAM CAFE ORDER SUCCESS
========================================= */


/* =========================================
   GET LAST ORDER
========================================= */

let orders = [];
try {
    const storedOrders = JSON.parse(
        localStorage.getItem("steamCafeOrders")
    );
    orders = Array.isArray(storedOrders) ? storedOrders : [];
} catch (error) {
    console.error("Unable to read saved orders.", error);
}


const lastOrder =
    orders.length > 0
        ? orders[orders.length - 1]
        : null;


/* =========================================
   ELEMENTS
========================================= */

const orderIdElement =
    document.getElementById("order-id");

const orderItemsElement =
    document.getElementById("order-items");

const subtotalElement =
    document.getElementById("order-subtotal");

const deliveryElement =
    document.getElementById("order-delivery");

const totalElement =
    document.getElementById("order-total");

const statusElement =
    document.getElementById("order-status-label");

const fulfillmentIcon =
    document.getElementById("fulfillment-icon");

const fulfillmentTitle =
    document.getElementById("fulfillment-title");

const fulfillmentDetails =
    document.getElementById("fulfillment-details");


/* =========================================
   NO ORDER
========================================= */

if (!lastOrder) {

    orderIdElement.textContent =
        "No recent order";

    orderItemsElement.innerHTML = `
        <p style="color:#777;">
            No order information was found.
        </p>
    `;

}


/* =========================================
   DISPLAY ORDER
========================================= */

if (lastOrder) {

    /* Order ID */

    orderIdElement.textContent =
        lastOrder.id;


    /* Status */

    statusElement.textContent =
        lastOrder.status;


    /* Items */

    orderItemsElement.innerHTML = "";


    lastOrder.items.forEach(item => {

        const itemElement =
            document.createElement("div");

        itemElement.className =
            "order-item";


        const itemTotal =
            item.price * item.quantity;


        itemElement.innerHTML = `

            <div class="order-item-image">
                🍔
            </div>

            <div class="order-item-info">

                <strong>
                    ${item.name}
                </strong>

                <span>
                    Quantity: ${item.quantity}
                </span>

            </div>

            <strong class="order-item-price">
                Rs. ${itemTotal.toLocaleString()}
            </strong>

        `;


        orderItemsElement.appendChild(
            itemElement
        );

    });


    /* Totals */

    subtotalElement.textContent =
        `Rs. ${lastOrder.subtotal.toLocaleString()}`;


    deliveryElement.textContent =
        `Rs. ${lastOrder.deliveryFee.toLocaleString()}`;


    totalElement.textContent =
        `Rs. ${lastOrder.total.toLocaleString()}`;


    /* =====================================
       FULFILLMENT
    ====================================== */

    if (lastOrder.fulfillment && lastOrder.fulfillment.type === "pickup") {

        fulfillmentIcon.className =
            "fa-solid fa-store";


        fulfillmentTitle.textContent =
            "Pickup";


        fulfillmentDetails.textContent =
            `Your order will be prepared for pickup from the selected Steam Cafe branch.`;

    } else if (lastOrder.fulfillment) {

        fulfillmentIcon.className =
            "fa-solid fa-motorcycle";


        fulfillmentTitle.textContent =
            "Delivery";


        fulfillmentDetails.textContent =
            `Your order will be delivered to ${lastOrder.fulfillment.address}, ${lastOrder.fulfillment.city}.`;

    }

}


/* =========================================
   FUTURE API CONNECTION
========================================= */

/*
   Later this page will retrieve the order
   from Order Service:

   GET /api/orders/{orderId}

   Example:

   fetch(`/api/orders/${lastOrder.id}`)
       .then(response => response.json())
       .then(order => {
           // render order
       });
*/