/* =========================================
   STEAM CAFE CART
========================================= */

const cartItemsContainer = document.getElementById("cart-items");
const emptyCart = document.getElementById("empty-cart");

const subtotalElement = document.getElementById("cart-subtotal");
const deliveryElement = document.getElementById("delivery-fee");
const totalElement = document.getElementById("cart-total");

const checkoutButton = document.getElementById("checkout-button");
const cartCountElement = document.getElementById("cart-count");


/* =========================================
   CART DATA
========================================= */

let cartItems = [];

try {
    const storedCart = JSON.parse(localStorage.getItem("steamCafeCart"));
    cartItems = Array.isArray(storedCart) ? storedCart : [];
} catch (error) {
    console.error("Unable to read the saved cart.", error);
}


/* =========================================
   DELIVERY FEE
========================================= */

const DELIVERY_FEE = 100;


/* =========================================
   SAVE CART
========================================= */

function saveCart() {

    localStorage.setItem(
        "steamCafeCart",
        JSON.stringify(cartItems)
    );
}


/* =========================================
   UPDATE CART COUNT
========================================= */

function updateCartPageCount() {

    const totalQuantity = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    if (cartCountElement) {

        cartCountElement.textContent = totalQuantity;

    }
}


/* =========================================
   RENDER CART
========================================= */

function renderCart() {

    cartItemsContainer.innerHTML = "";


    /* Empty cart */

    if (cartItems.length === 0) {

        emptyCart.classList.remove("hidden");

        checkoutButton.disabled = true;

        updateSummary(0);

        updateCartPageCount();

        return;
    }


    /* Hide empty cart */

    emptyCart.classList.add("hidden");

    checkoutButton.disabled = false;


    /* Create cart items */

    cartItems.forEach(item => {

        const itemTotal =
            item.price * item.quantity;


        const cartItem = document.createElement("div");

        cartItem.className = "cart-item";


        cartItem.innerHTML = `

            <div class="cart-item-image">
                🍔
            </div>


            <div class="cart-item-info">

                <h3>
                    ${item.name}
                </h3>

                <p>
                    Rs. ${item.price.toLocaleString()} each
                </p>

            </div>


            <div class="cart-item-actions">

                <div class="quantity-control">

                    <button
                        class="quantity-btn"
                        onclick="changeQuantity(${item.id}, -1)"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>


                    <span class="quantity-value">
                        ${item.quantity}
                    </span>


                    <button
                        class="quantity-btn"
                        onclick="changeQuantity(${item.id}, 1)"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>

                </div>


                <strong class="cart-item-price">
                    Rs. ${itemTotal.toLocaleString()}
                </strong>


                <button
                    class="remove-btn"
                    onclick="removeFromCart(${item.id})"
                    aria-label="Remove item"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>

        `;


        cartItemsContainer.appendChild(cartItem);

    });


    /* Update totals */

    calculateTotals();

    updateCartPageCount();
}


/* =========================================
   CHANGE QUANTITY
========================================= */

function changeQuantity(id, amount) {

    const item = cartItems.find(
        product => product.id === id
    );


    if (!item) {
        return;
    }


    item.quantity += amount;


    /* Remove if quantity reaches zero */

    if (item.quantity <= 0) {

        cartItems = cartItems.filter(
            product => product.id !== id
        );

    }


    saveCart();

    renderCart();
}


/* =========================================
   REMOVE ITEM
========================================= */

function removeFromCart(id) {

    cartItems = cartItems.filter(
        item => item.id !== id
    );


    saveCart();

    renderCart();

}


/* =========================================
   CALCULATE TOTALS
========================================= */

function calculateTotals() {

    const subtotal = cartItems.reduce(
        (total, item) => {

            return total +
                item.price * item.quantity;

        },
        0
    );


    updateSummary(subtotal);
}


/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary(subtotal) {

    const delivery =
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
   CHECKOUT
========================================= */

if (checkoutButton) {
    checkoutButton.addEventListener(
        "click",
        function () {

        if (cartItems.length === 0) {
            return;
        }


        window.location.href =
            "checkout.html";

        }
    );
}


/* =========================================
   INITIALIZE
========================================= */

renderCart();