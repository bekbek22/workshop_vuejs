import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    products: [],
    cart: [],
    token: localStorage.getItem('token') || null,
    user: null
  },
  getters: {
  },
  mutations: {
    setToken(state, token) {
      state.token = token
    },
    setUser(state, user) {
      state.user = user
    },
    logout(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
    },
    setProducts(state, products) {
      state.products = products;
    },
    addToCart(state, product) {
      const item = state.cart.find(i => i._id === product._id);
      if (item) {
        item.qty++;
      } else {
        state.cart.push({ ...product, qty: 1});
      }
    },
    removeFromCart(state, productId) {
      state.cart = state.cart.filter(p => p._id !== productId);
    },
    updateQty(state, {id, qty}) {
      const item = state.cart.find(p => p._id === id);
      if (item) item.qty = qty;
    },
    decreaseProductStock(state, { productId, quantity }) {
      const product = state.products.find(p => p._id === productId)
      if (product) {
        product.stock = Math.max(0, product.stock - quantity)
      }
    }
  },
  actions: {
    login({ commit }, token) {
      localStorage.setItem('token', token)
      commit('setToken', token)
      const payload = JSON.parse(atob(token.split('.')[1]))
      commit('setUser', payload)
    },
    logout({ commit }) {
      localStorage.removeItem('token')
      commit('logout')
    },
    async fetchProducts({ commit }) {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/products');
        console.log('API Response:', res.data)
        commit('setProducts', res.data)
      } catch (error) {
        console.log('API ERROR:', error)
      }
    }
  },
  modules: {
  }
})
