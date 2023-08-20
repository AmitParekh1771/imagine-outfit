const localDB = {
    pages: JSON.parse(localStorage.getItem('pages') || '[]'),
    currPageStamp: parseInt(localStorage.getItem('currPageStamp')) || Date.now()
};
console.log(JSON.parse(JSON.stringify(localDB)))

const starter = document.getElementById('starter');

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

const genderRef = document.getElementById('gender');
const ageRef = document.getElementById('age');
const occasionRef = document.getElementById('occasion');
const locationRef = document.getElementById('location');
const colorRef = document.getElementById('color');
const patternRef = document.getElementById('pattern');

genderRef.value = 'Male';
ageRef.value = '21';
occasionRef.value = 'Casual';
locationRef.value = 'Surat';
colorRef.value = 'White';
patternRef.value = 'Stripes';

let currentOutfits = [];
let currentDisplayedOutfits = [];

const productList = document.getElementById('product-list');

const productCard = (product, category) => {
    return `<div data-product="${category}" class="bg-white dark:bg-gray-800 p-4 max-w-[240px] w-full rounded shadow-md"><a href="${product.productLink}" target="_blank"><img data-property="product-image" src="${product.img}" alt="${category}" class="w-full h-56 object-contain mb-2"></a><h3 data-property="product-title" class="text-gray-800 dark:text-gray-200 font-semibold break-words"><a href="${product.productLink}" target="_blank">${product.title}</a></h3><p class="flex gap-2 text-green-600 dark:text-green-400 font-medium"><span data-property="product-mrp">${product.mrp}</span><span data-property="product-original-mrp" class="text-gray-500 line-through">${product.originalMrp}</span></p><p data-property="product-discount-percentage" class="text-sm text-gray-500 dark:text-gray-400">${product.discountPercentage}</p></div>`;
}

const getProduct = async (item) => {
    loaderText.innerText = `Fetching product details (${item.search}) ...`;

    const response = await fetch(`/flipkart?search=${encodeURI(item.search)}`);
    const data = await response.json();
    

    const currentProduct = document.querySelector(`[data-product="${item.category}"]`);

    if(currentProduct) {
        currentProduct.insertAdjacentHTML("afterend", productCard(data, item.category));
        productList.removeChild(currentProduct);
    }
    else productList.insertAdjacentHTML("beforeend", productCard(data, item.category));

    
    console.log(data);

    return {...data, category: item.category};
}

const getOutfits = async () => {
    loader.classList.remove('hidden');
    loaderText.innerText = 'Fetching fashion outfit items...';
    productList.innerHTML = '';
    starter.classList.remove('hidden');

    currentOutfits.splice(0, currentOutfits.length);
    currentDisplayedOutfits.splice(0, currentDisplayedOutfits.length);

    const response = await fetch('/openai/outfits', {
        method: 'POST',
        body: JSON.stringify({
            preferences: {
                age: ageRef.value,
                gender: genderRef.value,
                occasion: occasionRef.value,
                location: locationRef.value,
                color: colorRef.value,
                pattern: patternRef.value
            }
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
    
    for(let item of data.items) {
        const product = await getProduct(item);
        starter.classList.add('hidden');
        currentDisplayedOutfits.push(product);
        currentOutfits.push(item);
    }
    
    loaderText.innerText = 'Finishing up...';

    loader.classList.add('hidden');
}

const promptBox = document.getElementById('promptBox');
const promptSendBtn = document.getElementById('promptSendBtn');

const sendPrompt = async () => {
    loader.classList.remove('hidden');
    
    loaderText.innerText = 'Modifying fashion outfit items...';

    const response = await fetch('/openai/outfit-prompt', {
        method: 'POST',
        body: JSON.stringify({
            preferences: {
                age: ageRef.value,
                gender: genderRef.value,
                occasion: occasionRef.value,
                location: locationRef.value,
                color: colorRef.value,
                pattern: patternRef.value
            },
            currentOutfits,
            prompt: promptBox.value
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
    
    for(let item of data.items) {
        if(item.status == -1) {
            productList.removeChild(document.querySelector(`[data-product="${item.category}"]`));
            const index = currentOutfits.findIndex(currentItem => currentItem.category == item.category);
            currentOutfits.splice(index, 1);
            currentDisplayedOutfits.splice(index, 1);
        }
        if(item.status == 0 || item.status == -1) continue;

        const product = await getProduct(item);
        currentDisplayedOutfits.push(product);
        currentOutfits.push(item);
    }
    
    loaderText.innerText = 'Finishing up...';

    loader.classList.add('hidden');
}

promptSendBtn.addEventListener('click', (ev) => {
    sendPrompt();
    promptBox.value = '';
});
promptBox.addEventListener('keypress', (ev) => {
    if(ev.key == 'Enter') {
        ev.preventDefault();
        sendPrompt();
        promptBox.value = '';
    }
});

const preferenceBtn = document.getElementById('preferenceBtn');
preferenceBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    getOutfits();
});

const chatCard = (chatTitle, pageStamp) => {
    return `<div data-chat="${pageStamp}" class="p-3 rounded-md mb-2 hover:bg-gray-300 dark:hover:bg-gray-800 dark:text-gray-300 cursor-pointer"><div class="flex justify-between items-center gap-1"><h3 data-chatTitle="${pageStamp}" class="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">${chatTitle}</h3><button data-chatDelete="${pageStamp}" class="text-gray-600 dark:text-gray-300 hover:text-blue-500" title="Edit Title"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></div>`;
}

const pageTitle = document.getElementById('pageTitle');


const loadPage = (page) => {
    productList.innerHTML = '';
    pageTitle.innerText = page.title;
    
    page.currentDisplayedOutfits?.length ? starter.classList.add('hidden') : starter.classList.remove('hidden'); 

    currentOutfits = JSON.parse(JSON.stringify(page.currentOutfits));
    currentDisplayedOutfits = JSON.parse(JSON.stringify(page.currentDisplayedOutfits));
    
    for(let item of page.currentDisplayedOutfits)
        productList.insertAdjacentHTML("beforeend", productCard(item, item.category));
}

const loadChats = () => {
    for(let page of localDB.pages) chatHistory.insertAdjacentHTML("beforeend", chatCard(page.title, page.pageStamp));
}

const saveOutfitData = () => {
    const pageIndex = localDB.pages.findIndex(page => page.pageStamp == localDB.currPageStamp);
    if(pageIndex != -1) {
        localDB.pages[pageIndex].currentDisplayedOutfits = JSON.parse(JSON.stringify(currentDisplayedOutfits));
        localDB.pages[pageIndex].currentOutfits = JSON.parse(JSON.stringify(currentOutfits));
    }
}


const pageChange = (pageStamp) => {
    saveOutfitData();
    
    const pageIndex = localDB.pages.findIndex(page => page.pageStamp == pageStamp);
    if(pageIndex != -1) loadPage(localDB.pages[pageIndex]);
    localDB.currPageStamp = pageStamp;

    const chats = document.querySelectorAll('[data-chat]');
    for(let chat of chats) {
        chat.getAttribute('data-chat') == `${pageStamp}` ? chat.classList.add('bg-gray-300','dark:bg-gray-800') : chat.classList.remove('bg-gray-300','dark:bg-gray-800');
    }
}

const addPage = async (title = "My Outfit") => {
    const pageStamp = Date.now();
    chatHistory.insertAdjacentHTML("afterbegin", chatCard(title, pageStamp));

    localDB.currPageStamp = pageStamp;
    localDB.pages.splice(0, 0, {
        title,
        pageStamp,
        currentDisplayedOutfits: [],
        currentOutfits: []
    })

    pageChange(localDB.currPageStamp);

    productList.innerHTML = '';
    starter.classList.remove('hidden');
}

const deletePage = (pageStamp) => {
    const pageIndex = localDB.pages.findIndex(page => page.pageStamp == pageStamp);
    if(pageIndex != -1) localDB.pages.splice(pageIndex, 1);
    
    if(localDB.currPageStamp == pageStamp) {
        currentDisplayedOutfits = [];
        currentOutfits = [];
    }

    if(localDB.pages.length == 0) addPage();
    if(localDB.currPageStamp == pageStamp) pageChange(localDB.pages[0].pageStamp);

    const chatCard = document.querySelector(`[data-chat="${pageStamp}"]`);
    if(chatCard) chatHistory.removeChild(chatCard);
}

const updatePageTitle = (title, pageStamp) => {
    document.querySelector(`[data-chatTitle="${pageStamp}"]`).innerText = title;
    
    const pageIndex = localDB.pages.findIndex(page => page.pageStamp == pageStamp);
    if(pageIndex != -1) localDB.pages[pageIndex].title = title;
}
pageTitle.addEventListener('keypress', (ev) => {
    if(ev.key == 'Enter') {
        ev.preventDefault();
        return;
    }
});
pageTitle.addEventListener('input', (ev) => {
    updatePageTitle(ev.target.innerText, localDB.currPageStamp)
})

const chatHistory = document.getElementById('chatHistory');
chatHistory.addEventListener('click', (ev) => {
    const targets = ev.composedPath();
    
    try {
        const btnIndex = targets.findIndex(target => target.hasAttribute('data-chatDelete'));
        if(btnIndex != -1) {
            const pageStamp = parseInt(targets[btnIndex].getAttribute('data-chatDelete'));
            deletePage(pageStamp);
            return;
        }
    } catch(err) {}
    
    try {
        const chatIndex = targets.findIndex(target => target.hasAttribute('data-chat'));
        if(chatIndex != -1) {
            pageChange(parseInt(targets[chatIndex].getAttribute('data-chat')));
            return;
        }
    } catch(err) {}
    
});

const addChat = document.getElementById('add-chat-btn');
addChat.addEventListener('click', (ev) => {
    addPage();
});

// after load
loadChats();

localDB.pages.length ? 
loadPage(localDB.pages.find(page => page.pageStamp == localDB.currPageStamp)) :
addPage();

for(let chat of document.querySelectorAll('[data-chat]')) {
    chat.getAttribute('data-chat') == `${localDB.currPageStamp}` ? chat.classList.add('bg-gray-300','dark:bg-gray-800') : chat.classList.remove('bg-gray-300','dark:bg-gray-800');
}

window.addEventListener('beforeunload', (ev) => {
    saveOutfitData();

    localStorage.setItem('pages', JSON.stringify(localDB.pages))
    localStorage.setItem('currPageStamp', localDB.currPageStamp)
});