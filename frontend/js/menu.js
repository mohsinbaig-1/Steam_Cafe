// ==========================================
// STEAM CAFE MENU
// ==========================================


// ===============================
// VARIABLES
// ===============================

const productContainer =
    document.getElementById("product-container");

const searchInput =
    document.getElementById("search-input");

const productCount =
    document.getElementById("product-count");

const menuTitle =
    document.getElementById("menu-title");

const noResults =
    document.getElementById("no-results");

const categoryButtons =
    document.querySelectorAll(".category-filter");


let selectedCategory = "all";


// ===============================
// RENDER PRODUCTS
// ===============================

function renderProducts() {

    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();


    let filteredProducts =
        products.filter(product => {

            const matchesCategory =
                selectedCategory === "all" ||
                product.category === selectedCategory;


            const matchesSearch =
                product.name
                    .toLowerCase()
                    .includes(searchTerm) ||
                product.description
                    .toLowerCase()
                    .includes(searchTerm);


            return matchesCategory && matchesSearch;

        });


    // CLEAR CONTAINER

    productContainer.innerHTML = "";


    // NO RESULTS

    if (filteredProducts.length === 0) {

        noResults.style.display = "block";

        productCount.textContent = "0 items";

        return;

    }


    noResults.style.display = "none";


    productCount.textContent =
        `${filteredProducts.length} items`;


    // CREATE CARDS

    filteredProducts.forEach(product => {

        const card =
            document.createElement("article");

        card.className =
            "menu-product-card";


        card.innerHTML = `

            <div class="menu-product-image">

                ${
                    product.badge
                    ?
                    `<span class="menu-product-badge">
                        ${product.badge}
                    </span>`
                    :
                    ""
                }

                <div class="menu-product-emoji">
                    ${product.emoji}
                </div>

            </div>


            <div class="menu-product-info">

                <div class="menu-product-rating">

                    <i class="fa-solid fa-star"></i>

                    ${product.rating}

                </div>


                <h3>
                    ${product.name}
                </h3>


                <p>
                    ${product.description}
                </p>


                <div class="menu-product-bottom">

                    <span class="menu-product-price">
                        Rs. ${product.price}
                    </span>


                    <button
                        class="menu-add-button"
                        onclick="
                            addToCart(
                                ${product.id},
                                '${product.name}',
                                ${product.price}
                            )
                        "
                    >

                        <i class="fa-solid fa-plus"></i>

                        Add

                    </button>

                </div>

            </div>

        `;


        productContainer.appendChild(card);

    });

}


// ===============================
// CATEGORY FILTER
// ===============================

categoryButtons.forEach(button => {

    button.addEventListener("click", () => {


        // REMOVE ACTIVE

        categoryButtons.forEach(btn => {

            btn.classList.remove("active");

        });


        // ADD ACTIVE

        button.classList.add("active");


        // GET CATEGORY

        selectedCategory =
            button.dataset.category;


        // CHANGE TITLE

        const categoryName =
            button.textContent.trim();


        if (selectedCategory === "all") {

            menuTitle.textContent =
                "All Items";

        } else {

            menuTitle.textContent =
                categoryName.replace(
                    /[^a-zA-Z ]/g,
                    ""
                );

        }


        renderProducts();

    });

});


// ===============================
// SEARCH
// ===============================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderProducts
    );

}


// ===============================
// URL CATEGORY
// ===============================

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const urlCategory =
    urlParams.get("category");


if (urlCategory) {

    const matchingButton =
        document.querySelector(
            `[data-category="${urlCategory}"]`
        );


    if (matchingButton) {

        matchingButton.click();

    }

}


// ===============================
// INITIAL RENDER
// ===============================

renderProducts();
