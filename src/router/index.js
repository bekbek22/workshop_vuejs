import Vue from 'vue';
import Router from 'vue-router';
import ProductList from '@/pages/ProductList.vue';
import Cart from '@/pages/Cart.vue';
import AdminProduct from '@/pages/AdminProduct.vue';
import AdminOrder from '@/pages/AdminOrder.vue';
import Login from '@/pages/Login.vue';
import Register from '@/pages/Register.vue';
import AdminApprove from '@/pages/AdminApprove.vue'

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/register',
      name: 'Register',
      component: Register
    },
    { 
      path: '/', 
      name: 'ProductList', 
      component: ProductList 
    },
    { 
      path: '/cart', 
      name: 'Cart', 
      component: Cart 
    },
    { 
      path: '/admin/products', 
      name: 'AdminProduct', 
      component: AdminProduct,
      meta: {
        requiresAuth: true, role: 'admin'
      }
    },
    { 
      path: '/admin/orders', 
      name: 'AdminOrder', 
      component: AdminOrder,
      meta: {
        requiresAuth: true, role: 'admin'
      }
    },
    {
      path: '/admin/approve',
      name: 'AdminApprove',
      component: AdminApprove,
      meta: { requiresAuth: true, role: 'admin' }
    },
  ],
});
