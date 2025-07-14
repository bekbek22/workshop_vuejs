<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      app
      temporary
      :clipped="$vuetify.breakpoint.mdAndUp"
      class="primary"
      dark
    >
      <v-list-item class="py-4">
        <v-list-item-content>
          <v-list-item-title class="text-h5 font-weight-bold">
            <v-icon large left>mdi-shopping-outline</v-icon> Prohub Store
          </v-list-item-title>
          <v-list-item-subtitle class="mt-1">
            ร้านขายของเกี่ยวกับเกม
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider class="mb-2"></v-divider>

      <v-list-item v-if="isLoggedIn" class="px-6 py-2">
        <v-list-item-avatar>
          <v-icon large>mdi-account-circle</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title class="text-h6 white--text">{{ userName }}</v-list-item-title>
          <v-list-item-subtitle class="white--text text-capitalize font-weight-medium">
            <v-chip
              small
              label
              :color="userRole === 'admin' ? 'secondary' : 'light-blue accent-1'"
              class="white--text"
            >
              {{ userRole }}
            </v-chip>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-divider v-if="isLoggedIn" class="my-2"></v-divider>

      <v-list nav dense>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.to"
          link
          exact
          @click="drawer = false"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item v-if="isLoggedIn" @click="logout" class="mt-4">
          <v-list-item-icon>
            <v-icon>mdi-logout</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>ออกจากระบบ</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="primary" dark clipped-left>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      
      <v-toolbar-title class="font-weight-bold">{{ currentRouteTitle }}</v-toolbar-title>

      <v-spacer></v-spacer>

      <template v-if="isLoggedIn">
        <v-menu bottom left offset-y>
          <template #activator="{ on, attrs }">
            <v-btn
              text
              v-bind="attrs"
              v-on="on"
              class="white--text text-capitalize"
            >
              <v-icon left>mdi-account-circle</v-icon>
              {{ userName }}
              <v-chip
                small
                label
                class="ml-2"
                :color="userRole === 'admin' ? 'secondary' : 'light-blue accent-1'"
                dark
              >
                {{ userRole }}
              </v-chip>
              <v-icon right>mdi-menu-down</v-icon>
            </v-btn>
          </template>

          <v-list dense>
            <v-list-item @click="logout">
              <v-list-item-icon><v-icon>mdi-logout</v-icon></v-list-item-icon>
              <v-list-item-title>ออกจากระบบ</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template v-else>
        <v-btn text to="/login" class="white--text font-weight-bold">
          <v-icon left>mdi-login</v-icon> เข้าสู่ระบบ
        </v-btn>
        <v-btn text to="/register" class="white--text font-weight-bold ml-2">
          <v-icon left>mdi-account-plus</v-icon> สมัครสมาชิก
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <router-view :key="refreshKey" />
    </v-main>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      drawer: false,
      refreshKey: 0 // ใช้สำหรับ force re-render router-view
    }
  },
  computed: {
    isLoggedIn() {
      // ตรวจสอบว่ามี token ใน Vuex store หรือไม่
      return !!this.$store.state.token
    },
    userName() {
      // ดึง username จาก Vuex store
      return this.$store.state.user?.username || ''
    },
    userRole() {
      // ดึง role จาก Vuex store
      return this.$store.state.user?.role || ''
    },
    menuItems() {
      const items = [
        { title: 'หน้าหลัก', to: '/', icon: 'mdi-home' },
        { title: 'ตะกร้าสินค้า', to: '/cart', icon: 'mdi-cart' } // เปลี่ยน icon เป็น mdi-cart
      ]
      
      // เพิ่มเมนูสำหรับ Admin
      if (this.userRole === 'admin') {
        items.push(
          { title: 'จัดการสินค้า', to: '/admin/products', icon: 'mdi-package-variant-closed' },
          { title: 'จัดการออเดอร์', to: '/admin/orders', icon: 'mdi-receipt' },
          { title: 'อนุมัติผู้ใช้', to: '/admin/approve', icon: 'mdi-account-check' }
        )
      }
      return items
    },
    currentRouteTitle() {
      const route = this.$route.meta.title;
      if (route) {
        return route;
      }
      // fallback titles
      switch (this.$route.path) {
        case '/': return 'หน้าหลัก';
        case '/cart': return 'ตะกร้าสินค้า';
        case '/login': return 'เข้าสู่ระบบ';
        case '/register': return 'สมัครสมาชิก';
        case '/admin/products': return 'จัดการสินค้า';
        case '/admin/orders': return 'จัดการรายการสั่งซื้อ';
        case '/admin/approve': return 'อนุมัติผู้ใช้';
        default: return 'Dashboard'; // Default title if no meta.title
      }
    }
  },
  watch: {
    // Watch for route changes to re-check user status and potentially refresh components
    $route() {
      this.checkUser();
    }
  },
  created() {
    // Initial check when the app is created
    const token = localStorage.getItem('token');
    if (token) {
      this.$store.commit('setToken', token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          username: payload.username || '',
          role: payload.role || ''
        };
        this.$store.commit('setUser', user);
      } catch (err) {
        console.error('Token parsing error:', err);
        // Clear token if it's invalid
        this.$store.dispatch('logout');
      }
    }
    this.refreshKey++; // Ensure components using router-view are re-rendered
  },
  methods: {
    // This method is now redundant because computed properties and Vuex state handle the user info.
    // It's still here for reference, but the core logic is in created() and computed properties.
    checkUser() {
      // The user state (isLoggedIn, userName, userRole) is primarily managed by Vuex store.
      // This method ensures that if route changes, the menu items are re-evaluated based on the current user role.
      // The refreshKey is used here to force re-render components in <router-view> if needed,
      // especially useful if components don't react to state changes automatically (less common in Vuex).
      this.refreshKey++;
    },
    logout() {
      this.$store.dispatch('logout');
      this.$router.push('/login');
      this.showSnackbar('ออกจากระบบสำเร็จ', 'success');
    },
    showSnackbar(message, type = 'success') {
      // Assumes you have a snackbar mechanism, e.g., using a global component or Vuex state for snackbars.
      // If not, you'd need to implement this. For now, it's a placeholder.
      console.log(`Snackbar: ${message} (${type})`);
      // Example of how you might integrate with a global snackbar component
      // this.$root.$emit('show-snackbar', message, type); 
    }
  }
}
</script>

<style scoped>
/* Ensure font is applied to the whole app for consistency */
.v-application {
  font-family: 'Roboto', sans-serif;
}

/* Specific styling for navigation drawer (optional, but can enhance the look) */
.v-navigation-drawer.primary {
  background: linear-gradient(to bottom, var(--v-primary-base), var(--v-primary-darken1));
}

.v-list-item-title,
.v-list-item-subtitle {
  color: white !important; /* Ensure text is white in dark drawer */
}

/* Adjust padding for app bar nav icon to align better */
.v-app-bar .v-app-bar-nav-icon {
  margin-right: 8px; /* Or adjust as needed */
}

/* Hide original menu-down icon for v-menu activator to allow custom icon placement */
.v-btn .v-icon.mdi-menu-down {
  display: none;
}
</style>