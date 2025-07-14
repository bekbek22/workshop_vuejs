<template>
  <v-container class="my-5">
    <h2 class="text-h4 text-center mb-6 font-weight-bold primary--text">
      <v-icon large left>mdi-cart-outline</v-icon> ตะกร้าสินค้า
    </h2>

    <v-card class="elevation-4 pa-4">
      <v-data-table
        :headers="headers"
        :items="cartItems"
        item-key="_id"
        class="elevation-1"
        hide-default-footer
        :no-data-text="cartItems.length === 0 ? 'ไม่มีสินค้าในตะกร้า' : 'ไม่พบข้อมูล'"
      >
        <template v-slot:item.image="{ item }">
          <v-avatar size="60" rounded="lg">
            <v-img :src="getImage(item.product)" alt="Product Image"></v-img>
          </v-avatar>
        </template>
        <template v-slot:item.productName="{ item }">
          <span class="font-weight-medium">{{ item.product.name }}</span>
        </template>
        <template v-slot:item.price="{ item }">
          <span class="font-weight-medium primary--text">{{ item.price.toLocaleString() }}</span> บาท
        </template>
        <template v-slot:item.quantity="{ item }">
          <div class="d-flex align-center">
            <v-btn
              icon
              small
              color="primary"
              :disabled="item.quantity <= 1"
              @click="updateQuantity(item.product._id, item.quantity - 1)"
              aria-label="ลดจำนวน"
            >
              <v-icon>mdi-minus</v-icon>
            </v-btn>
            <v-text-field
              v-model.number="item.quantity"
              type="number"
              min="1"
              :max="item.product.stock"
              class="mx-2 quantity-input-table"
              hide-details
              dense
              outlined
              color="primary"
              @change="updateQuantity(item.product._id, item.quantity)"
            ></v-text-field>
            <v-btn
              icon
              small
              color="primary"
              :disabled="item.quantity >= item.product.stock"
              @click="updateQuantity(item.product._id, item.quantity + 1)"
              aria-label="เพิ่มจำนวน"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </div>
        </template>
        <template v-slot:item.total="{ item }">
          <span class="font-weight-bold">{{ (item.price * item.quantity).toLocaleString() }}</span> บาท
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon color="red" @click="confirmRemoveItem(item.product._id, item.product.name)" aria-label="ลบสินค้า">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-card class="elevation-4 pa-4 mt-5">
      <div class="text-right text-h5 font-weight-bold mb-4">
        ยอดรวมทั้งหมด: <span class="primary--text">{{ totalPrice.toLocaleString() }}</span> บาท
      </div>
      <div class="d-flex justify-end">
        <v-btn color="red" class="white--text mr-4" large @click="confirmClearCart" :disabled="cartItems.length === 0">
          <v-icon left>mdi-trash-can</v-icon>
          ล้างตะกร้า
        </v-btn>
        <v-btn color="success" class="text-white" large @click="confirmCheckout" :disabled="cartItems.length === 0">
          <v-icon left>mdi-cash-check</v-icon>
          ยืนยันสั่งซื้อ
        </v-btn>
      </div>
    </v-card>

    <v-dialog v-model="dialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h5" :class="dialog.color">{{ dialog.title }}</v-card-title>
        <v-card-text class="py-4">{{ dialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="dialog.show = false">ยกเลิก</v-btn>
          <v-btn :color="dialog.confirmColor" text @click="dialog.action()">ตกลง</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" bottom right>
      <v-icon left>{{ snackbar.icon }}</v-icon>
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">
          ปิด
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      cartItems: [],
      headers: [
        { text: 'รูปภาพ', value: 'image', sortable: false },
        { text: 'สินค้า', value: 'productName' },
        { text: 'ราคา/ชิ้น', value: 'price' },
        { text: 'จำนวน', value: 'quantity' },
        { text: 'ราคารวม', value: 'total' },
        { text: 'จัดการ', value: 'actions', sortable: false }
      ],
      snackbar: {
        show: false,
        message: '',
        color: 'success',
        icon: 'mdi-check-circle'
      },
      dialog: {
        show: false,
        title: '',
        message: '',
        color: '',
        confirmColor: '',
        action: null,
      }
    }
  },
  computed: {
    totalPrice() {
      return this.cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
    }
  },
  created() {
    this.fetchCart()
  },
  methods: {
    getImage(product) {
      if (product.images && product.images.length > 0) {
        const imageUrl = product.images[0];
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          return imageUrl;
        }
        return `http://localhost:3000${imageUrl}`;
      }
      return `https://via.placeholder.com/60x60/E0E0E0/424242?text=No+Img`;
    },
    showSnackbar(message, color = 'success') {
      this.snackbar.message = message
      this.snackbar.color = color
      this.snackbar.icon = color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'
      this.snackbar.show = true
    },
    async fetchCart() {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          this.cartItems = []; // เคลียร์ตะกร้าถ้าไม่มี token
          this.showSnackbar('กรุณาเข้าสู่ระบบเพื่อดูตะกร้าสินค้า', 'info');
          // this.$router.push('/login'); // อาจจะ redirect ไปหน้า Login
          return;
        }
        const res = await axios.get('http://localhost:3000/api/v1/cart', {
          headers: { Authorization: `Bearer ${token}` }
        })
        // ตรวจสอบให้แน่ใจว่า res.data.data.items มีข้อมูลครบถ้วนสำหรับ product, price, quantity
        this.cartItems = res.data.data.items.map(item => ({
          _id: item._id, // เพิ่ม _id ของ item ในตะกร้า
          product: item.product,
          price: item.product.price, // ดึงราคาจาก product
          quantity: item.quantity
        }));
      } catch (err) {
        console.error('โหลดตะกร้าไม่สำเร็จ:', err)
        this.showSnackbar('เกิดข้อผิดพลาดในการโหลดตะกร้า', 'error')
      }
    },
    confirmCheckout() {
      if (this.cartItems.length === 0) {
        this.showSnackbar('ไม่มีสินค้าในตะกร้า โปรดเพิ่มสินค้าก่อนสั่งซื้อ', 'warning');
        return;
      }
      this.dialog = {
        show: true,
        title: 'ยืนยันการสั่งซื้อ',
        message: 'คุณต้องการยืนยันการสั่งซื้อสินค้าทั้งหมดในตะกร้าใช่หรือไม่?',
        color: 'success',
        confirmColor: 'success',
        action: this.checkout
      };
    },
    async checkout() {
      this.dialog.show = false; // ปิด dialog ทันที
      try {
        const token = localStorage.getItem('token')
        await axios.post(
          'http://localhost:3000/api/v1/orders/checkout',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        this.cartItems = []
        this.showSnackbar('สั่งซื้อสำเร็จแล้ว!', 'success')
        // *** สำคัญ: สั่งให้หน้า Product refresh ข้อมูลสินค้าใหม่ ***
        this.$store.dispatch('fetchProducts'); // เรียก action ใน Vuex store
        // this.$router.push('/order-history'); // อาจจะ redirect ไปหน้าประวัติการสั่งซื้อ
      } catch (err) {
        console.error('สั่งซื้อไม่สำเร็จ:', err)
        const errorMessage = err.response && err.response.data && err.response.data.message 
                             ? err.response.data.message 
                             : 'เกิดข้อผิดพลาดในการสั่งซื้อ';
        this.showSnackbar(errorMessage, 'error');
      }
    },
    confirmClearCart() {
      if (this.cartItems.length === 0) {
        this.showSnackbar('ตะกร้าสินค้าว่างเปล่าอยู่แล้ว', 'info');
        return;
      }
      this.dialog = {
        show: true,
        title: 'ยืนยันการล้างตะกร้า',
        message: 'คุณต้องการล้างสินค้าทั้งหมดออกจากตะกร้าใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
        color: 'red',
        confirmColor: 'red',
        action: this.clearCart
      };
    },
    async clearCart() {
      this.dialog.show = false; // ปิด dialog ทันที
      try {
        const token = localStorage.getItem('token')
        await axios.delete('http://localhost:3000/api/v1/cart', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.cartItems = []
        this.$store.commit('clearCart'); // อัปเดต Vuex store ด้วย
        this.showSnackbar('ล้างตะกร้าสำเร็จแล้ว', 'success')
        // ไม่ต้อง refresh products เพราะไม่ได้กระทบสต็อก
      } catch (err) {
        console.error('ล้างตะกร้าไม่สำเร็จ:', err)
        const errorMessage = err.response && err.response.data && err.response.data.message 
                             ? err.response.data.message 
                             : 'เกิดข้อผิดพลาดในการล้างตะกร้า';
        this.showSnackbar(errorMessage, 'error');
      }
    },
    confirmRemoveItem(productId, productName) {
      this.dialog = {
        show: true,
        title: 'ยืนยันการลบสินค้า',
        message: `คุณต้องการลบ "${productName}" ออกจากตะกร้าใช่หรือไม่?`,
        color: 'red',
        confirmColor: 'red',
        action: () => this.removeItem(productId)
      };
    },
    async removeItem(productId) {
      this.dialog.show = false; // ปิด dialog ทันที
      try {
        const token = localStorage.getItem('token')
        const res = await axios.delete(`http://localhost:3000/api/v1/cart/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        // อัปเดต cartItems จาก response ของ API หรือ fetch ใหม่
        this.cartItems = res.data.data.items.map(item => ({
          _id: item._id,
          product: item.product,
          price: item.product.price,
          quantity: item.quantity
        }));
        this.$store.commit('removeItemFromCart', productId); // อัปเดต Vuex store ด้วย
        this.showSnackbar('ลบสินค้าออกสำเร็จ', 'success')
      } catch (err) {
        console.error('ลบสินค้าไม่สำเร็จ:', err)
        const errorMessage = err.response && err.response.data && err.response.data.message 
                             ? err.response.data.message 
                             : 'ลบสินค้าไม่สำเร็จ';
        this.showSnackbar(errorMessage, 'error');
      }
    },
    async updateQuantity(productId, newQuantity) {
      // ค้นหาสินค้าในตะกร้าเพื่อตรวจสอบสต็อก
      const itemToUpdate = this.cartItems.find(item => item.product._id === productId);
      if (!itemToUpdate) {
        this.showSnackbar('ไม่พบสินค้าในตะกร้า', 'error');
        return;
      }

      const productStock = itemToUpdate.product.stock;
      let finalQuantity = parseInt(newQuantity);

      if (isNaN(finalQuantity) || finalQuantity < 1) {
        finalQuantity = 1;
      } else if (finalQuantity > productStock) {
        finalQuantity = productStock;
        this.showSnackbar(`จำนวนสินค้าสูงสุดคือ ${productStock} ชิ้น`, 'warning');
      }

      // หากจำนวนไม่ได้เปลี่ยน หรือเปลี่ยนเป็นค่าเดิม ไม่ต้องเรียก API
      if (itemToUpdate.quantity === finalQuantity) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:3000/api/v1/cart/${productId}`, { quantity: finalQuantity }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // อัปเดตเฉพาะ quantity ใน cartItems ที่มีอยู่แล้ว
        itemToUpdate.quantity = finalQuantity;
        this.showSnackbar('อัปเดตจำนวนสินค้าสำเร็จ', 'success');
        this.$store.commit('updateCartItemQuantity', { productId, quantity: finalQuantity }); // อัปเดต Vuex store ด้วย

      } catch (err) {
        console.error('อัปเดตจำนวนไม่สำเร็จ:', err);
        const errorMessage = err.response && err.response.data && err.response.data.message 
                             ? err.response.data.message 
                             : 'เกิดข้อผิดพลาดในการอัปเดตจำนวน';
        this.showSnackbar(errorMessage, 'error');
        // หากเกิดข้อผิดพลาด ควรกู้คืน quantity กลับไปเป็นค่าเดิม
        this.fetchCart(); 
      }
    }
  }
}
</script>

<style scoped>
.v-container {
  max-width: 1000px;
}

.v-data-table {
  background-color: white;
  border-radius: 8px;
}

.v-data-table >>> th {
  font-size: 1rem !important;
  font-weight: bold;
  color: #616161 !important; /* Grey 700 */
}

.v-data-table >>> td {
  font-size: 0.95rem;
}

.quantity-input-table {
  max-width: 70px;
  text-align: center;
  margin: 0 8px;
}

/* Custom styling for the text-field in the data table */
.quantity-input-table >>> .v-input__control {
  height: auto !important; /* Allow height to adjust */
}
.quantity-input-table >>> .v-input__slot {
  min-height: 36px !important; /* Adjust min height for small input */
  padding: 0 8px !important;
  align-items: center;
}
.quantity-input-table >>> input {
  text-align: center;
}
</style>