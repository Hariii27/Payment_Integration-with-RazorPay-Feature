const prodcuts = [
    {id: 'starter', name: 'Starter Plan', price:499},
    {id: 'pro', name: 'Pro Plan', price: 999},
    {id:'premium', name: 'premium Plan',price: 1999},
];

const getProducts = (id) => products.find((p) => p.id === id);

module.exports = {products, getProduct};