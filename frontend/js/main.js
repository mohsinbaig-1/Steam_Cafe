// ======================================
// STEAM CAFE MAIN JAVASCRIPT
// ======================================


// ===============================
// MOBILE MENU
// ===============================

const mobileMenuButton =
    document.getElementById("mobile-menu-button") ||
    document.getElementById("menu-toggle");

const mobileMenu =
    document.getElementById("mobile-menu") ||
    document.getElementById("nav-menu") ||
    document.querySelector(".nav-links");


if (mobileMenuButton && mobileMenu) {

    mobileMenuButton.addEventListener("click", () => {

        const isOpen = mobileMenu.classList.contains("is-open");

        if (isOpen) {

            mobileMenu.classList.remove("is-open");
            mobileMenu.style.display = "";
            mobileMenuButton.setAttribute("aria-expanded", "false");

        } else {

            mobileMenu.classList.add("is-open");
            mobileMenu.style.display = "block";
            mobileMenuButton.setAttribute("aria-expanded", "true");

        }

    });

}


// ===============================
// CART
// ===============================

let cart = [];

try {
    const storedCart = JSON.parse(localStorage.getItem("steamCafeCart"));
    cart = Array.isArray(storedCart) ? storedCart : [];
} catch (error) {
    console.error("Unable to read the saved cart.", error);
}


// ===============================
// UPDATE CART COUNT
// ===============================

function updateCartCount() {

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    document.querySelectorAll("#cart-count").forEach(cartCount => {
        cartCount.textContent = totalItems;
    });
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