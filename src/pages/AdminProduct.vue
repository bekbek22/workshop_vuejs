<template>
  <v-container class="my-5">
    <h2 class="text-h4 text-center mb-6 font-weight-bold primary--text">
      <v-icon large left>mdi-package-variant-closed</v-icon> จัดการสินค้า (Admin)
    </h2>

    <v-card class="elevation-4 pa-4 mb-6">
      <v-card-title class="pa-0">
        <v-btn
          color="primary"
          class="text-white font-weight-bold"
          rounded
          elevation="2"
          @click="openDialog()"
        >
          <v-icon left>mdi-plus-circle</v-icon> เพิ่มสินค้าใหม่
        </v-btn>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="ค้นหาสินค้า..."
          single-line
          hide-details
          clearable
          outlined
          dense
        ></v-text-field>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="products"
        :search="search"
        item-key="_id"
        class="elevation-1 product-admin-table"
        :loading="loading"
        loading-text="กำลังโหลดสินค้า..."
        no-data-text="ไม่พบสินค้า"
      >
        <template v-slot:item.images="{ item }">
          <v-avatar size="60" rounded="lg" class="my-2">
            <v-img :src="getImage(item)" alt="Product Image"></v-img>
          </v-avatar>
        </template>

        <template v-slot:item.name="{ item }">
          <span class="font-weight-bold text-body-1">{{ item.name }}</span>
          <br />
          <span class="text-caption text--secondary text-truncate-2">{{ item.description || 'ไม่มีรายละเอียด' }}</span>
        </template>

        <template v-slot:item.price="{ item }">
          <span class="font-weight-medium primary--text">{{ item.price.toLocaleString() }}</span> บาท
        </template>

        <template v-slot:item.stock="{ item }">
          <v-chip :color="item.stock === 0 ? 'red' : (item.stock < 10 ? 'orange' : 'green')" dark small>
            {{ item.stock }}
          </v-chip>
        </template>

        <template v-slot:item.isActive="{ item }">
          <v-chip :color="item.isActive ? 'green' : 'red'" dark small>
            {{ item.isActive ? 'เปิดใช้งาน' : 'ปิดการใช้งาน' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            color="blue-grey"
            dark
            small
            class="mr-2 text-white font-weight-bold"
            rounded
            elevation="1"
            @click="openDialog(item)"
          >
            <v-icon left>mdi-pencil</v-icon>
            แก้ไข
          </v-btn>

          <v-btn
            :color="item.isActive ? 'red darken-1' : 'green darken-1'"
            dark
            small
            class="text-white font-weight-bold"
            rounded
            elevation="1"
            @click="toggleActive(item)"
          >
            <v-icon left>{{ item.isActive ? 'mdi-close-circle' : 'mdi-check-circle' }}</v-icon>
            {{ item.isActive ? 'ปิดการใช้งาน' : 'เปิดใช้งาน' }}
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="primary white--text">
          <span class="headline">{{ form._id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</span>
        </v-card-title>
        <v-card-text class="py-4">
          <v-form ref="formRef" v-model="valid" lazy-validation>
            <v-text-field
              v-model="form.name"
              label="ชื่อสินค้า"
              :rules="[rules.required, rules.minNameLength]"
              outlined
              dense
              class="mb-2"
            />
            <v-textarea
              v-model="form.description"
              label="รายละเอียดสินค้า"
              outlined
              dense
              rows="3"
              class="mb-2"
            />
            <v-text-field
              v-model.number="form.price"
              label="ราคา (บาท)"
              type="number"
              :rules="[rules.required, rules.positiveNumber]"
              outlined
              dense
              class="mb-2"
            />
            <v-text-field
              v-model.number="form.stock"
              label="จำนวนในสต็อก"
              type="number"
              :rules="[rules.required, rules.nonNegativeNumber]"
              outlined
              dense
              class="mb-4"
            />
            
            <v-file-input
              v-model="form.newImages"
              label="เพิ่มรูปภาพสินค้าใหม่"
              placeholder="เลือกไฟล์รูปภาพ"
              accept="image/*"
              multiple
              prepend-icon="mdi-camera"
              show-size
              chips
              clearable
              outlined
              dense
              counter
              class="mb-4"
            >
              <template v-slot:selection="{ file, index }">
                <v-chip v-if="index < 3" small label color="primary">
                  {{ file.name }}
                </v-chip>
                <span v-else-if="index === 3" class="text-overline grey--text text--darken-3 mx-2">
                  +{{ form.newImages.length - 3 }} ไฟล์
                </span>
              </template>
            </v-file-input>

            <div v-if="form._id && form.existingImages && form.existingImages.length > 0" class="mb-4">
              <p class="font-weight-medium">รูปภาพที่มีอยู่เดิม:</p>
              <v-row dense>
                <v-col
                  v-for="(imgUrl, idx) in form.existingImages"
                  :key="idx"
                  cols="4"
                  class="d-flex flex-column align-center"
                >
                  <v-img :src="getExistingImage(imgUrl)" height="80px" width="80px" contain class="mb-1"></v-img>
                  <v-btn
                    icon
                    x-small
                    color="red"
                    @click="removeExistingImage(idx)"
                    aria-label="ลบรูปภาพ"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </div>

          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey darken-1" text @click="closeDialog">ยกเลิก</v-btn>
          <v-btn color="primary" @click="submitForm" :disabled="!valid">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmToggleDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5" :class="confirmToggleItem.isActive ? 'red--text' : 'green--text'">
          ยืนยันการเปลี่ยนสถานะ
        </v-card-title>
        <v-card-text class="py-4">
          คุณต้องการ{{ confirmToggleItem.isActive ? 'ปิดการใช้งาน' : 'เปิดใช้งาน' }}สินค้า "<span class="font-weight-bold">{{ confirmToggleItem.name }}</span>" ใช่หรือไม่?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="confirmToggleDialog = false">ยกเลิก</v-btn>
          <v-btn :color="confirmToggleItem.isActive ? 'red darken-1' : 'green darken-1'" text @click="executeToggleActive">ตกลง</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      bottom
      right
    >
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
import axios from 'axios';

export default {
  data() {
    return {
      dialog: false,
      confirmToggleDialog: false, // Dialog for confirming toggle active
      confirmToggleItem: {}, // Item to be toggled
      search: '', // สำหรับค้นหาใน data-table
      loading: false, // สำหรับแสดง loading state
      valid: true, // สำหรับ Vuetify form validation
      form: {
        _id: null,
        name: '',
        description: '',
        price: 0,
        stock: 0,
        newImages: [], // สำหรับรูปภาพใหม่ที่จะอัปโหลด
        existingImages: [] // สำหรับรูปภาพเดิมที่ดึงมาจาก backend
      },
      products: [],
      headers: [
        { text: 'รูปภาพ', value: 'images', sortable: false, width: '80px' },
        { text: 'ชื่อสินค้า / รายละเอียด', value: 'name' },
        { text: 'ราคา', value: 'price' },
        { text: 'สต็อก', value: 'stock' },
        { text: 'สถานะ', value: 'isActive' },
        { text: 'จัดการ', value: 'actions', sortable: false, width: '200px' }
      ],
      snackbar: {
        show: false,
        message: '',
        color: '',
        icon: ''
      },
      rules: {
        required: value => !!value || 'จำเป็นต้องกรอก',
        positiveNumber: value => (value > 0) || 'ต้องเป็นตัวเลขที่มากกว่า 0',
        nonNegativeNumber: value => (value >= 0) || 'ต้องเป็นตัวเลขที่ไม่ติดลบ',
        minNameLength: value => (value && value.length >= 3) || 'ชื่อสินค้าต้องมีอย่างน้อย 3 ตัวอักษร',
      }
    };
  },
  created() {
    this.checkAdmin();
    this.fetchProducts();
  },
  methods: {
    checkAdmin() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'admin') {
          this.showSnackbar('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (ต้องเป็นแอดมินเท่านั้น)', 'error');
          this.$router.push('/');
        }
      } catch (e) {
        console.error('Invalid token:', e);
        this.showSnackbar('การตรวจสอบสิทธิ์ล้มเหลว กรุณาเข้าสู่ระบบใหม่', 'error');
        this.$router.push('/login');
      }
    },
    showSnackbar(message, type = 'success') {
      this.snackbar.message = message;
      this.snackbar.color = type === 'success' ? 'green' : (type === 'error' ? 'red' : 'orange');
      this.snackbar.icon = type === 'success' ? 'mdi-check-circle' : (type === 'error' ? 'mdi-alert-circle' : 'mdi-information');
      this.snackbar.show = true;
    },
    getImage(product) {
      if (product.images && product.images.length > 0) {
        const imageUrl = product.images[0];
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          return imageUrl;
        }
        return `http://localhost:3000${imageUrl}`;
      }
      return `https://via.placeholder.com/60x60/F5F5F5/BDBDBD?text=No+Img`; // Placeholder image
    },
    getExistingImage(imageUrl) {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      return `http://localhost:3000${imageUrl}`;
    },
    async fetchProducts() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:3000/api/v1/products`, { // ใช้ Absolute URL ที่ถูกต้อง
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // แก้ไข: เข้าถึงข้อมูลโดยตรงจาก res.data เพราะ API คืนค่าเป็น Array
        this.products = res.data.map(product => ({
          ...product,
          isActive: product.isActive !== undefined ? product.isActive : true
        }));
        
      } catch (err) {
        console.error('โหลดสินค้าไม่สำเร็จ:', err);
        this.showSnackbar('โหลดสินค้าไม่สำเร็จ', 'error');
        if (err.response && err.response.status === 401) {
          this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },
    openDialog(product = null) {
      this.dialog = true;
      if (product) {
        this.form = {
          _id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          newImages: [],
          existingImages: product.images || []
        };
      } else {
        this.form = {
          _id: null,
          name: '',
          description: '',
          price: 0,
          stock: 0,
          newImages: [],
          existingImages: []
        };
      }
      this.$nextTick(() => {
        this.$refs.formRef?.resetValidation();
      });
    },
    closeDialog() {
      this.dialog = false;
      this.form = { _id: null, name: '', description: '', price: 0, stock: 0, newImages: [], existingImages: [] };
      this.$refs.formRef?.resetValidation();
    },
    removeExistingImage(index) {
      this.form.existingImages.splice(index, 1);
      this.showSnackbar('ลบรูปภาพเดิมออกแล้ว (จะบันทึกเมื่อกด "บันทึก")', 'info');
    },
    async submitForm() {
      if (!this.$refs.formRef.validate()) {
        this.showSnackbar('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'warning');
        return;
      }

      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', this.form.name);
      formData.append('description', this.form.description);
      formData.append('price', this.form.price);
      formData.append('stock', this.form.stock);
      
      // สำหรับรูปภาพใหม่
      if (this.form.newImages && this.form.newImages.length > 0) {
        for (let file of this.form.newImages) {
          formData.append('images', file); 
        }
      }

      // สำหรับรูปภาพเดิมที่ยังเหลืออยู่ (ถ้ามี)
      if (this.form.existingImages && this.form.existingImages.length > 0) {
         formData.append('existingImages', JSON.stringify(this.form.existingImages));
      } else {
         formData.append('existingImages', '[]'); 
      }
      
      try {
        if (this.form._id) {
          // แก้ไขสินค้า
          await axios.put(`http://localhost:3000/api/v1/products/${this.form._id}`, formData, { 
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          this.showSnackbar('แก้ไขสินค้าสำเร็จ', 'success');
        } else {
          // เพิ่มสินค้าใหม่
          await axios.post('http://localhost:3000/api/v1/products', formData, { 
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          this.showSnackbar('เพิ่มสินค้าสำเร็จ', 'success');
        }
        this.closeDialog();
        this.fetchProducts();
      } catch (err) {
        console.error('บันทึกไม่สำเร็จ:', err);
        const errorMessage = err.response && err.response.data && err.response.data.message 
                             ? err.response.data.message 
                             : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        this.showSnackbar(errorMessage, 'error');
      }
    },
    toggleActive(product) {
      this.confirmToggleItem = product;
      this.confirmToggleDialog = true;
    },
    async executeToggleActive() {
      this.confirmToggleDialog = false; 
      const product = this.confirmToggleItem;
      try {
        const token = localStorage.getItem('token');
        const updated = {
          isActive: !product.isActive
        };
        await axios.put(`http://localhost:3000/api/v1/products/${product._id}`, updated, { 
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.showSnackbar(`เปลี่ยนสถานะ "${product.name}" สำเร็จ`, 'success');
        this.fetchProducts();
      } catch (err) {
        console.error('เปลี่ยนสถานะไม่สำเร็จ:', err);
        const errorMessage = err.response && err.response.data && err.response.data.message 
                             ? err.response.data.message 
                             : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ';
        this.showSnackbar(errorMessage, 'error');
      }
    }
  }
};
</script>

<style scoped>
.v-container {
  max-width: 1200px;
}

.product-admin-table >>> th {
  font-size: 1rem !important;
  font-weight: bold;
  color: #424242 !important;
}

.product-admin-table >>> td {
  font-size: 0.95rem;
  vertical-align: middle;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v-file-input >>> .v-chip {
  margin: 2px;
  height: 24px;
}
</style>