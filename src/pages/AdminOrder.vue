<template>
  <v-container class="my-5">
    <h2 class="text-h4 text-center mb-6 font-weight-bold primary--text">
      <v-icon large left>mdi-clipboard-list-outline</v-icon> จัดการรายการสั่งซื้อทั้งหมด (Admin)
    </h2>

    <v-card class="elevation-4 pa-4 mb-6">
      <v-card-title class="pa-0">
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="ค้นหารายการสั่งซื้อ..."
          single-line
          hide-details
          clearable
          outlined
          dense
        ></v-text-field>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="orders"
        :search="search"
        item-key="_id"
        class="elevation-1 order-admin-table"
        :loading="loading"
        loading-text="กำลังโหลดรายการสั่งซื้อ..."
        no-data-text="ไม่พบรายการสั่งซื้อ"
      >
        <template v-slot:item.customer="{ item }">
          <div v-if="item.user">
            <span class="font-weight-bold">{{ item.user.username }}</span>
            <br />
            <span class="text-caption text--secondary">{{ item.user.email }}</span>
          </div>
          <span v-else class="red--text">
            [ผู้ใช้ถูกลบแล้ว]
          </span>
        </template>

        <template v-slot:item.products="{ item }">
          <ul class="order-product-list">
            <li v-for="p in item.products" :key="p._id">
              <span v-if="p.product">
                <span class="font-weight-medium">{{ p.product.name }}</span> × {{ p.quantity }} ชิ้น
              </span>
              <span v-else class="red--text">
                [สินค้าถูกลบแล้ว] × {{ p.quantity }} ชิ้น
              </span>
            </li>
          </ul>
        </template>

        <template v-slot:item.total="{ item }">
          <span class="font-weight-medium primary--text">{{ item.total.toLocaleString() }}</span> บาท
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark small class="font-weight-bold">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            color="blue"
            dark
            small
            class="text-white font-weight-bold"
            rounded
            elevation="1"
            @click="openStatusDialog(item)"
          >
            <v-icon left>mdi-update</v-icon>
            เปลี่ยนสถานะ
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="statusDialog" max-width="450px">
      <v-card>
        <v-card-title class="primary white--text">
          <span class="headline">เปลี่ยนสถานะคำสั่งซื้อ #{{ selectedOrder._id ? selectedOrder._id.substring(0, 8) + '...' : '' }}</span>
        </v-card-title>
        <v-card-text class="py-4">
          <v-form ref="statusFormRef" v-model="validStatusForm" lazy-validation>
            <v-select
              v-model="newStatus"
              :items="statusOptions"
              item-text="text" item-value="value" label="เลือกสถานะใหม่"
              :rules="[rules.required]"
              outlined
              dense
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="statusDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="updateOrderStatus" :disabled="!validStatusForm">บันทึก</v-btn>
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
      orders: [],
      loading: false,
      search: '', // สำหรับค้นหา
      statusDialog: false, // ควบคุมการเปิด/ปิด Dialog เปลี่ยนสถานะ
      selectedOrder: {}, // เก็บข้อมูลคำสั่งซื้อที่เลือกเพื่อเปลี่ยนสถานะ
      newStatus: '', // สถานะใหม่ที่เลือกจาก v-select
      validStatusForm: true, // สำหรับ Vuetify form validation ใน Dialog
      headers: [
        { text: 'หมายเลขคำสั่งซื้อ', value: '_id' },
        { text: 'ผู้สั่งซื้อ', value: 'customer' }, // เพิ่มคอลัมน์ผู้สั่งซื้อ
        { text: 'สินค้า', value: 'products', sortable: false },
        { text: 'ราคารวม', value: 'total' },
        { text: 'สถานะ', value: 'status' },
        { text: 'วันที่สั่งซื้อ', value: 'createdAt' }, // เพิ่มวันที่สั่งซื้อ
        { text: 'จัดการ', value: 'actions', sortable: false }
      ],
      statusOptions: [ // ตัวเลือกสถานะ
        { text: 'รอดำเนินการ', value: 'pending' },
        { text: 'กำลังดำเนินการ', value: 'processing' }, // เพิ่มสถานะ 'processing'
        { text: 'กำลังจัดส่ง', value: 'shipped' },
        { text: 'จัดส่งแล้ว', value: 'delivered' },     // เพิ่มสถานะ 'delivered'
        { text: 'ยกเลิก', value: 'cancelled' }
      ],
      snackbar: {
        show: false,
        message: '',
        color: '',
        icon: ''
      },
      rules: {
        required: value => !!value || 'จำเป็นต้องเลือกสถานะ'
      }
    };
  },
  async created() {
    this.checkAdmin();
    await this.fetchOrders();
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
    async fetchOrders() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3000/api/v1/orders', { 
          headers: { Authorization: `Bearer ${token}` }
        });
        this.orders = res.data; 
      } catch (err) {
        console.error('โหลดรายการสั่งซื้อไม่สำเร็จ:', err.response ? err.response.data : err.message);
        const errorMessage = err.response && err.response.data && err.response.data.message 
                               ? err.response.data.message 
                               : 'เกิดข้อผิดพลาดในการโหลดรายการสั่งซื้อ';
        this.showSnackbar(errorMessage, 'error');
        if (err.response && err.response.status === 401) {
          this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },
    getStatusColor(status) {
      switch (status) {
        case 'pending': return 'orange darken-2';
        case 'processing': return 'purple darken-1'; // สีสำหรับ 'กำลังดำเนินการ'
        case 'shipped': return 'blue darken-2';
        case 'delivered': return 'green darken-2'; // สีสำหรับ 'จัดส่งแล้ว'
        case 'completed': return 'teal darken-1'; // เปลี่ยนสี 'completed' ให้แตกต่าง
        case 'cancelled': return 'red darken-2';
        default: return 'grey';
      }
    },
    getStatusText(status) {
      const option = this.statusOptions.find(opt => opt.value === status);
      return option ? option.text : status;
    },
    formatDate(dateString) {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('th-TH', options);
    },
    openStatusDialog(order) {
      this.selectedOrder = { ...order }; // คัดลอกข้อมูล order เพื่อไม่ให้กระทบกับตารางโดยตรง
      this.newStatus = order.status; // กำหนดสถานะปัจจุบันเป็นค่าเริ่มต้น
      this.statusDialog = true;
      this.$nextTick(() => {
        this.$refs.statusFormRef?.resetValidation();
      });
    },
    async updateOrderStatus() {
      if (!this.$refs.statusFormRef.validate()) {
        this.showSnackbar('กรุณาเลือกสถานะใหม่', 'warning');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        this.showSnackbar('ไม่พบโทเค็นการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่', 'error');
        this.$router.push('/login');
        return;
      }

      if (!this.selectedOrder || !this.selectedOrder._id) {
        this.showSnackbar('ไม่พบข้อมูลคำสั่งซื้อที่เลือก', 'error');
        return;
      }

      try {
        const orderIdToUpdate = this.selectedOrder._id;

        const res = await axios.patch(`http://localhost:3000/api/v1/orders/${orderIdToUpdate}/status`, 
          { status: this.newStatus }, 
          {
            headers: {
              Authorization: `Bearer ${token}` 
            }
          }
        );
        console.log(res)
        this.showSnackbar(`อัปเดตสถานะคำสั่งซื้อ #${this.selectedOrder._id.substring(0, 8)}... เป็น "${this.getStatusText(this.newStatus)}" สำเร็จ`, 'success');
        this.statusDialog = false; 
        this.fetchOrders(); 
      } catch (err) {
        console.error('อัปเดตสถานะไม่สำเร็จ:', err.response ? err.response.data : err.message);
        const errorMessage = err.response && err.response.data && err.response.data.message 
                             ? err.response.data.message 
                             : 'เกิดข้อผิดพลาดในการอัปเดตสถานะ';
        this.showSnackbar(errorMessage, 'error');
        if (err.response && err.response.status === 401) {
          this.$router.push('/login');
        }
      }
    }
  }
};
</script>

<style scoped>
.v-container {
  max-width: 1200px;
}

.order-admin-table >>> th {
  font-size: 1rem !important;
  font-weight: bold;
  color: #424242 !important; /* Grey 800 */
}

.order-admin-table >>> td {
  font-size: 0.95rem;
  vertical-align: middle; /* จัดให้เนื้อหาอยู่กึ่งกลางแนวตั้ง */
}

.order-product-list {
  padding-left: 20px;
  margin-bottom: 0;
}

.order-product-list li {
  margin-bottom: 4px;
}
</style>