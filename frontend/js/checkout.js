/* =========================================
   STEAM CAFE CHECKOUT
========================================= */

const checkoutItems =
    document.getElementById("checkout-items");

const subtotalElement =
    document.getElementById("checkout-subtotal");

const deliveryElement =
    document.getElementById("checkout-delivery");

const totalElement =
    document.getElementById("checkout-total");

const cartCountElement =
    document.getElementById("cart-count");

const deliverySection =
    document.getElementById("delivery-section");

const pickupSection =
    document.getElementById("pickup-section");

const placeOrderButton =
    document.getElementById("place-order-btn");

const checkoutMessage =
    document.getElementById("checkout-message");


/* =========================================
   CART
========================================= */

let checkoutCart = [];

try {
    const storedCart = JSON.parse(localStorage.getItem("steamCafeCart"));
    checkoutCart = Array.isArray(storedCart) ? storedCart : [];
} catch (error) {
    console.error("Unable to read the saved cart.", error);
}


/* =========================================
   DELIVERY FEES
========================================= */

const DELIVERY_FEE = 100;


/* =========================================
   UPDATE CART COUNT
========================================= */

function updateCheckoutCartCount() {

    const quantity = checkoutCart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    if (cartCountElement) {
        cartCountElement.textContent = quantity;
    }
}


/* =========================================
   RENDER ORDER
========================================= */

function renderCheckoutItems() {

    checkoutItems.innerHTML = "";


    if (checkoutCart.length === 0) {

        checkoutItems.innerHTML = `
            <p style="color:#777;font-size:13px;">
                Your cart is empty.
            </p>
        `;

        placeOrderButton.disabled = true;

        calculateTotal();

        return;
    }


    checkoutCart.forEach(item => {

        const itemTotal =
            item.price * item.quantity;


        const element =
            document.createElement("div");

        element.className =
            "checkout-item";


        element.innerHTML = `

            <div class="checkout-item-image">
                🍔
            </div>

            <div class="checkout-item-info">

                <strong>
                    ${item.name}
                </strong>

                <span>
                    Qty: ${item.quantity}
                </span>

            </div>

            <strong class="checkout-item-price">
                Rs. ${itemTotal.toLocaleString()}
            </strong>

        `;


        checkoutItems.appendChild(element);

    });


    calculateTotal();
}


/* =========================================
   CALCULATE TOTAL
========================================= */

function calculateTotal() {

    const subtotal = checkoutCart.reduce(
        (total, item) => {

            return total +
                item.price * item.quantity;

        },
        0
    );


    const selectedMethod =
        document.querySelector(
            'input[name="order-method"]:checked'
        );


    const delivery =
        selectedMethod &&
        selectedMethod.value === "delivery" &&
        subtotal > 0
            ? DELIVERY_FEE
            : 0;


    const total =
        subtotal + delivery;


    subtotalElement.textContent =
        `Rs. ${subtotal.toLocaleString()}`;


    deliveryElement.textContent =
        `Rs. ${delivery.toLocaleString()}`;


    totalElement.textContent =
        `Rs. ${total.toLocaleString()}`;
}


/* =========================================
   ORDER METHOD
========================================= */

const methodOptions =
    document.querySelectorAll(
        'input[name="order-method"]'
    );


methodOptions.forEach(input => {

    input.addEventListener(
        "change",
        function () {

            const method =
                this.value;


            methodOptions.forEach(option => {

                option.closest(
                    ".method-option"
                ).classList.remove("active");

            });


            this.closest(
                ".method-option"
            ).classList.add("active");


            if (method === "delivery") {

                deliverySection.classList.remove(
                    "hidden"
                );

                pickupSection.classList.add(
                    "hidden"
                );

            } else {

                deliverySection.classList.add(
                    "hidden"
                );

                pickupSection.classList.remove(
                    "hidden"
                );

            }


            calculateTotal();

        }
    );

});


/* =========================================
   BRANCH SELECTION
========================================= */

const branchOptions =
    document.querySelectorAll(
        'input[name="branch"]'
    );


branchOptions.forEach(input => {

    input.addEventListener(
        "change",
        function () {

            branchOptions.forEach(option => {

                option.closest(
                    ".branch-option"
                ).classList.remove("active");

            });


            this.closest(
                ".branch-option"
            ).classList.add("active");

        }
    );

});


/* =========================================
   PAYMENT SELECTION
========================================= */

const paymentOptions =
    document.querySelectorAll(
        'input[name="payment"]'
    );


paymentOptions.forEach(input => {

    input.addEventListener(
        "change",
        function () {

            paymentOptions.forEach(option => {

                option.closest(
                    ".payment-option"
                ).classList.remove("active");

            });


            this.closest(
                ".payment-option"
            ).classList.add("active");

        }
    );

});


/* =========================================
   SHOW MESSAGE
========================================= */

function showCheckoutMessage(
    message,
    type
) {

    checkoutMessage.textContent =
        message;

    checkoutMessage.className =
        `checkout-message show ${type}`;

}


/* =========================================
   VALIDATE ORDER
========================================= */

function validateOrder() {

    if (checkoutCart.length === 0) {

        showCheckoutMessage(
            "Your cart is empty.",
            "error"
        );

        return false;
    }


    const selectedMethod = document.querySelector(
        'input[name="order-method"]:checked'
    );

    if (!selectedMethod) {
        showCheckoutMessage("Please select an order method.", "error");
        return false;
    }

    const method = selectedMethod.value;


    if (method === "delivery") {

        const name =
            document.getElementById(
                "full-name"
            ).value.trim();

        const phone =
            document.getElementById(
                "phone"
            ).value.trim();

        const address =
            document.getElementById(
                "address"
            ).value.trim();

        const city =
            document.getElementById(
                "city"
            ).value.trim();


        const phonePattern =
            /^(03\d{2}[-\s]?\d{7}|\+92\s?3\d{2}[-\s]?\d{7})$/;

        if (
            !name ||
            !phone ||
            !address ||
            !city ||
            !phonePattern.test(phone)
        ) {

            showCheckoutMessage(
                "Please provide valid delivery information and a valid Pakistani phone number.",
                "error"
            );

            return false;
        }

    }


    return true;
}


/* =========================================
   CREATE ORDER
========================================= */

function createOrder() {

    const method =
        document.querySelector(
            'input[name="order-method"]:checked'
        ).value;


    const payment =
        document.querySelector(
            'input[name="payment"]:checked'
        ).value;


    const notes =
        document.getElementById(
            "order-notes"
        ).value.trim();


    const subtotal =
        checkoutCart.reduce(
            (total, item) =>
                total +
                item.price * item.quantity,
            0
        );


    const delivery =
        method === "delivery"
            ? DELIVERY_FEE
            : 0;


    const total =
        subtotal + delivery;


    let fulfillment = {};


    if (method === "delivery") {

        fulfillment = {

            type: "delivery",

            name:
                document.getElementById(
                    "full-name"
                ).value.trim(),

            phone:
                document.getElementById(
                    "phone"
                ).value.trim(),

            address:
                document.getElementById(
                    "address"
                ).value.trim(),

            city:
                document.getElementById(
                    "city"
                ).value.trim(),

            area:
                document.getElementById(
                    "area"
                ).value.trim()

        };

    } else {

        fulfillment = {

            type: "pickup",

            branch:
                document.querySelector(
                    'input[name="branch"]:checked'
                ).value

        };

    }


    const order = {

        id:
            "SC-" +
            Date.now(),

        items:
            checkoutCart,

        subtotal:
            subtotal,

        deliveryFee:
            delivery,

        total:
            total,

        fulfillment:
            fulfillment,

        paymentMethod:
            payment,

        notes:
            notes,

        status:
            "Pending",

        createdAt:
            new Date().toISOString()

    };


    return order;
}


/* =========================================
   PLACE ORDER
========================================= */

placeOrderButton.addEventListener(
    "click",
    function () {

        if (!validateOrder()) {
            return;
        }


        const order = createOrder();


        /* Save order locally for now */

        let orders = [];
        try {
            const storedOrders = JSON.parse(
                localStorage.getItem("steamCafeOrders")
            );
            orders = Array.isArray(storedOrders) ? storedOrders : [];
        } catch (error) {
            console.error("Unable to read saved orders.", error);
        }


        orders.push(order);


        localStorage.setItem(
            "steamCafeOrders",
            JSON.stringify(orders)
        );


        /* Clear cart */

        localStorage.removeItem(
            "steamCafeCart"
        );


        showCheckoutMessage(
            `Order ${order.id} placed successfully!`,
            "success"
        );


        placeOrderButton.disabled = true;


        updateCheckoutCartCount();


        /*
         * Later:
         *
         * fetch("/api/orders", {
         *     method: "POST",
         *     body: JSON.stringify(order)
         * });
         *
         * This will connect to Order Service.
         */


        setTimeout(() => {

            window.location.href =
                "order-success.html";

        }, 1500);

    }
);


/* =========================================
   INITIALIZE
========================================= */

updateCheckoutCartCount();

renderCheckoutItems();