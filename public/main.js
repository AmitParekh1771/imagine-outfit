const darkModeToggle = document.getElementById('darkModeToggle');
const toggleIndicator = document.getElementById('toggleIndicator');

const toggler = () => {
    toggleIndicator.style.transform = darkModeToggle.checked ? 'translateX(100%)' : 'translateX(0)';
    document.documentElement.classList.toggle('dark', darkModeToggle.checked);
    localStorage.setItem('isDarkMode', darkModeToggle.checked);
};

darkModeToggle.addEventListener('change', toggler);

darkModeToggle.checked = localStorage.getItem('isDarkMode') == 'true';
toggler();

const textarea = document.getElementById("promptBox");
textarea.addEventListener('input', (ev) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}, false);

const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
loader.classList.add('hidden');

const preferences = {
    gender: 'Male',
    age: '21',
    occasion: 'Casual',
    location: 'Surat',
    color: 'White',
    pattern: 'Stripes'
}

const genderRef = document.getElementById('gender');
const ageRef = document.getElementById('age');
const occasionRef = document.getElementById('occasion');
const locationRef = document.getElementById('location');
const colorRef = document.getElementById('color');
const patternRef = document.getElementById('pattern');

genderRef.value = preferences.gender;
ageRef.value = preferences.age;
occasionRef.value = preferences.occasion;
locationRef.value = preferences.location;
colorRef.value = preferences.color;
patternRef.value = preferences.pattern;

const currentOutfits = [];

const productList = document.getElementById('product-list');

const productCard = (product) => {
    return `<div data-product="${product.type}" class="bg-white dark:bg-gray-800 p-4 max-w-[240px] w-full rounded shadow-md"><img data-property="product-image" src="${product.img}" alt="${product.type}" class="w-full h-56 object-contain mb-2"><h3 data-property="product-title" class="text-gray-800 dark:text-gray-200 font-semibold break-words">${product.title}</h3><p class="flex gap-2 text-green-600 dark:text-green-400 font-medium"><span data-property="product-mrp">${product.mrp}</span><span data-property="product-original-mrp" class="text-gray-500 line-through">${product.originalMrp}</span></p><p data-property="product-discount-percentage" class="text-sm text-gray-500 dark:text-gray-400">${product.discountPercentage}</p></div>`;
}

const getProduct = async (type, filters = []) => {
    loaderText.innerText = `Fetching product details (${type}) ...`;

    const response = await fetch('/flipkart', { 
        method: 'POST', 
        body: JSON.stringify({
            type,
            filters
        }),
        headers: { 
            "Content-Type": "application/json"
        }
    });
    const data = await response.json();

    const currentProduct = document.querySelector(`[data-product="${type}"]`);

    if(currentProduct) {
        currentProduct.insertAdjacentHTML("afterend", productCard(data));
        productList.removeChild(currentProduct);
    }
    else productList.insertAdjacentHTML("beforeend", productCard(data));

    console.log(data);
}

(async function() {
    loader.classList.remove('hidden');
    
    loaderText.innerText = 'Fetching fashion outfit items...';

    const response = await fetch('/openai/outfits', {
        method: 'POST',
        body: JSON.stringify({
            preferences
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
    
    for(let item of data.productList) await getProduct(item.type, item.filters);
    
    loaderText.innerText = 'Finishing up...';

    loader.classList.add('hidden');
})();