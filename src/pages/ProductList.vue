<template>
  <v-container class="my-5">
    <h2 class="text-h4 text-center mb-6 font-weight-bold primary--text">
      สินค้าทั้งหมด
    </h2>
    <v-row dense>
      <v-col
        v-for="product in products"
        :key="product._id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card outlined elevation="6" class="product-card mx-auto" max-width="380">
          <v-img
            :src="getImage(product)"
            height="220"
            class="rounded-t-lg"
            cover
          >
            <template v-slot:placeholder>
              <v-row
                class="fill-height ma-0"
                align="center"
                justify="center"
              >
                <v-progress-circular
                  indeterminate
                  color="grey lighten-5"
                ></v-progress-circular>
              </v-row>
            </template>
          </v-img>

          <v-card-title class="text-h6 font-weight-bold product-title">
            {{ product.name }}
          </v-card-title>

          <v-card-subtitle class="text-subtitle-1 price-text">
            <span class="font-weight-bold primary--text">{{ product.price.toLocaleString() }}</span> บาท
          </v-card-subtitle>

          <v-card-text class="product-description-text">
            <div class="mb-2 text-body-2 text-truncate-3">
              {{ product.description || 'ไม่มีรายละเอียดสินค้า' }}
            </div>
            <div class="text-body-2 font-weight-medium stock-info"
                 :class="{'red--text': product.stock === 0, 'green--text': product.stock > 0}">
              <strong>คงเหลือ: {{ product.stock }} ชิ้น</strong>
            </div>
          </v-card-text>

          <v-divider class="mx-4"></v-divider>

          <v-card-actions class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <v-btn
                icon
                small
                color="primary"
                :disabled="quantities[product._id] <= 1"
                @click="decreaseQuantity(product._id)"
                aria-label="ลดจำนวน"
              >
                <v-icon>mdi-minus</v-icon>
              </v-btn>

              <v-text-field
                v-model.number="quantities[product._id]"
                type="number"
                min="1"
                :max="product.stock"
                class="quantity-input mx-2"
                hide-details
                dense
                outlined
                color="primary"
                @input="validateQuantity(product._id)"
              />

              <v-btn
                icon
                small
                color="primary"
                :disabled="quantities[product._id] >= product.stock"
                @click="increaseQuantity(product._id)"
                aria-label="เพิ่มจำนวน"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>

            <v-btn
              color="primary"
              class="text-white add-to-cart-btn"
              :disabled="product.stock === 0"
              @click="addToCart(product)"
              elevation="4"
              rounded
            >
              <v-icon left>mdi-cart-plus</v-icon>
              เพิ่มลงตะกร้า
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

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
      quantities: {},
      snackbar: {
        show: false,
        message: '',
        color: 'success',
        icon: 'mdi-check-circle'
      }
    }
  },
  computed: {
    products() {
      // ตรวจสอบว่า products มีค่าเป็น null หรือ undefined หรือไม่
      // ถ้าเป็น null/undefined ให้ส่ง array ว่างกลับไป เพื่อป้องกัน error
      return this.$store.state.products || []
    }
  },
  created() {
    // ตรวจสอบว่า products ยังไม่มีข้อมูลหรือไม่ ก่อนที่จะ dispatch fetchProducts
    // เพื่อป้องกันการ fetch ซ้ำซ้อน หากข้อมูลมีอยู่แล้ว
    if (!this.products.length) {
      this.$store.dispatch('fetchProducts');
    }
  },
  watch: {
    products: {
      immediate: true,
      handler(newProducts) {
        if (newProducts && newProducts.length) { // ตรวจสอบว่า newProducts มีข้อมูล
          newProducts.forEach(product => {
            if (!this.quantities[product._id]) {
              this.$set(this.quantities, product._id, 1)
            }
          })
        }
      }
    }
  },
  methods: {
    getImage(product) {
      if (product.images && product.images.length > 0) {
        // ตรวจสอบว่า URL ภาพเป็น absolute path หรือไม่ ถ้าไม่ ให้เพิ่ม base URL
        const imageUrl = product.images[0];
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          return imageUrl;
        }
        return `http://localhost:3000${imageUrl}`;
      }
      // ภาพ placeholder ที่สวยงามขึ้นเล็กน้อย
      return `https://via.placeholder.com/300x220/E0E0E0/424242?text=${encodeURIComponent(product.name)}`;
    },
    increaseQuantity(productId) {
      if (!this.quantities[productId]) {
        this.$set(this.quantities, productId, 1)
      }
      const currentStock = this.getProductStock(productId);
      if (this.quantities[productId] < currentStock) {
        this.quantities[productId]++;
      } else {
        this.showSnackbar(`ไม่สามารถเพิ่มเกินสต็อกสินค้า (${currentStock} ชิ้น)`, 'error');
      }
    },
    decreaseQuantity(productId) {
      if (this.quantities[productId] > 1) {
        this.quantities[productId]--;
      } else {
        this.showSnackbar('จำนวนสินค้าต้องไม่น้อยกว่า 1 ชิ้น', 'error');
      }
    },
    validateQuantity(productId) {
      let value = this.quantities[productId];
      const stock = this.getProductStock(productId);

      if (value < 1 || isNaN(value)) {
        value = 1;
      } else if (value > stock) {
        value = stock;
        this.showSnackbar(`จำนวนสินค้าสูงสุดคือ ${stock} ชิ้น`, 'error');
      }
      this.$set(this.quantities, productId, value);
    },
    getProductStock(productId) {
      const product = this.products.find(p => p._id === productId)
      return product ? product.stock : 0
    },
    async addToCart(product) {
      const quantity = this.quantities[product._id] || 1

      if (quantity < 1) {
        return this.showSnackbar('กรุณาระบุจำนวนให้ถูกต้อง', 'error')
      }

      if (quantity > product.stock) {
        return this.showSnackbar(`สินค้าในสต็อกมีแค่ ${product.stock} ชิ้น`, 'error')
      }

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          // หากไม่มี token ให้แสดงข้อความแจ้งเตือนและอาจจะ redirect ไปหน้า login
          this.showSnackbar('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า', 'error');
          // this.$router.push('/login'); // หรือจะ redirect ไปหน้า Login
          return;
        }

        // ตั้งค่า baseURL ใน axios หรือใช้ full URL ที่นี่
        // สมมติว่า base URL ของ API คือ http://localhost:3000
        await axios.post('http://localhost:3000/api/v1/cart', {
          productId: product._id,
          quantity
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        this.$store.commit('addToCart', { ...product, qty: quantity })
        this.$set(this.quantities, product._id, 1) // Reset quantity to 1 after adding to cart
        this.showSnackbar(`เพิ่ม "${product.name}" จำนวน ${quantity} ชิ้น ลงตะกร้าแล้ว`, 'success')
      } catch (err) {
        console.error('เพิ่มสินค้าลงตะกร้าไม่สำเร็จ:', err);
        let errorMessage = 'เกิดข้อผิดพลาดในการเพิ่มสินค้า';
        if (err.response && err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
        } else if (err.message) {
            errorMessage = err.message;
        }
        this.showSnackbar(errorMessage, 'error');
      }
    },
    showSnackbar(message, type = 'success') {
      this.snackbar.message = message
      this.snackbar.color = type === 'success' ? 'success' : 'error'
      this.snackbar.icon = type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'
      this.snackbar.show = true
    }
  }
}
</script>

<style scoped>
.product-card {
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  border-radius: 12px; /* เพิ่มความโค้งมนของ card */
  overflow: hidden;
}

.product-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); /* เงาเข้มขึ้นเมื่อ hover */
  transform: translateY(-5px); /* ยก card ขึ้นเล็กน้อยเมื่อ hover */
}

.product-title {
  padding-bottom: 0px !important; /* ปรับ padding ให้กระชับขึ้น */
}

.price-text {
  padding-top: 4px !important; /* ปรับ padding ให้กระชับขึ้น */
  font-size: 1.1em; /* เพิ่มขนาดตัวอักษรราคา */
}

.product-description-text {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  line-height: 1.5;
}

.text-truncate-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* จำกัดข้อความเป็น 3 บรรทัด */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-info {
  margin-top: 8px;
}

.quantity-input {
  max-width: 70px; /* เพิ่มขนาดเล็กน้อยเพื่อให้ตัวเลขดูง่ายขึ้น */
}

.add-to-cart-btn {
  font-weight: bold;
}

/* ปรับปรุง Snackbar เพื่อให้มีสีตัวอักษรที่ตัดกันและดูชัดเจน */
.v-snackbar.v-snackbar--bottom.v-snackbar--right .v-btn {
  color: white !important;
}
</style>