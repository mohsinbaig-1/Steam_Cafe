javascript
// ======================================
// STEAM CAFE MAIN JAVASCRIPT
// ======================================


// ===============================
// MOBILE MENU
// ===============================

const mobileMenuButton =
    document.getElementById("mobile-menu-button");

const mobileMenu =
    document.getElementById("mobile-menu");


if (mobileMenuButton && mobileMenu) {

    mobileMenuButton.addEventListener("click", () => {

        if (mobileMenu.style.display === "block") {

            mobileMenu.style.display = "none";

        } else {

            mobileMenu.style.display = "block";

        }

    });

}


// ===============================
// CART
// ===============================

let cart =
    JSON.parse(localStorage.getItem("steamCafeCart")) || [];


// ===============================
// UPDATE CART COUNT
// ===============================

function updateCartCount() {

    const cartCount =
        document.getElementById("cart-count");

    if (!cartCount) return;

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    cartCount.textContent = totalItems;
}


// ===============================
// ADD TO CART
// ===============================

function addToCart(id, name, price) {

    const existingProduct =
        cart.find(item => item.id === id);


    if (existingProduct) {

        existingProduct.quantity += 1;

    } else {

        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: 1
        });

    }


    localStorage.setItem(
        "steamCafeCart",
        JSON.stringify(cart)
    );


    updateCartCount();

    showToast(`${name} added to cart`);
}


// ===============================
// TOAST
// ===============================

function showToast(message) {

    let toast =
        document.querySelector(".toast");


    if (!toast) {

        toast = document.createElement("div");

        toast.className = "toast";

        document.body.appendChild(toast);

    }


    toast.textContent = message;

    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 2000);
}


// ===============================
// INITIALIZE
// ===============================

updateCartCount();