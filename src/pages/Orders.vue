<template>
  <v-container class="my-5">
    <h2 class="text-h4 text-center mb-6 font-weight-bold primary--text">
      <v-icon large left>mdi-history</v-icon> ประวัติการสั่งซื้อของฉัน
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
        class="elevation-1 order-user-table"
        :loading="loading"
        loading-text="กำลังโหลดประวัติการสั่งซื้อ..."
        no-data-text="คุณยังไม่มีรายการสั่งซื้อ"
      >
        <template v-slot:item.products="{ item }">
          <ul class="order-product-list">
            <li v-for="p in item.products" :key="p.product ? p.product._id : p.productId">
              <span v-if="p.product && p.product.name">
                <span class="font-weight-medium">{{ p.product.name }}</span> × {{ p.quantity }} ชิ้น
              </span>
              <span v-else class="red--text">
                [สินค้าถูกลบ/ไม่ระบุชื่อ] × {{ p.quantity }} ชิ้น
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
            color="primary"
            dark
            small
            class="text-white font-weight-bold"
            rounded
            elevation="1"
            @click="viewOrderDetails(item._id)"
          >
            <v-icon left>mdi-eye</v-icon>
            ดูรายละเอียด
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

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

    <v-dialog v-model="detailsDialog" max-width="800px">
        <v-card v-if="selectedOrderDetails">
            <v-card-title class="primary white--text">
                <span class="headline">รายละเอียดคำสั่งซื้อ #{{ selectedOrderDetails.orderId ? selectedOrderDetails.orderId.substring(0, 8) + '...' : '' }}</span>
                <v-spacer></v-spacer>
                <v-btn icon dark @click="detailsDialog = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-card-text class="py-4">
                <v-row>
                    <v-col cols="12" md="6">
                        <h3 class="text-h6 mb-2">ข้อมูลผู้รับ</h3>
                        <p><strong>ชื่อ:</strong> {{ selectedOrderDetails.user ? selectedOrderDetails.user.username : 'N/A' }}</p>
                        <div v-if="selectedOrderDetails.shippingAddress">
                            <p><strong>ที่อยู่:</strong> {{ selectedOrderDetails.shippingAddress.street }}, {{ selectedOrderDetails.shippingAddress.city }}, {{ selectedOrderDetails.shippingAddress.province }} {{ selectedOrderDetails.shippingAddress.zipCode }}</p>
                            <p><strong>โทรศัพท์:</strong> {{ selectedOrderDetails.shippingAddress.phone }}</p>
                        </div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <h3 class="text-h6 mb-2">สถานะ & การชำระเงิน</h3>
                        <p><strong>สถานะคำสั่งซื้อ:</strong>
                            <v-chip :color="getStatusColor(selectedOrderDetails.status)" dark small class="font-weight-bold">
                                {{ getStatusText(selectedOrderDetails.status) }}
                            </v-chip>
                        </p>
                        <p v-if="selectedOrderDetails.paymentStatus"><strong>สถานะการชำระเงิน:</strong>
                             <v-chip :color="getPaymentStatusColor(selectedOrderDetails.paymentStatus)" dark small class="font-weight-bold">
                                 {{ getPaymentStatusText(selectedOrderDetails.paymentStatus) }}
                            </v-chip>
                        </p>
                        <p v-if="selectedOrderDetails.paymentMethod"><strong>ช่องทางชำระเงิน:</strong> {{ selectedOrderDetails.paymentMethod }}</p>
                        <p v-if="selectedOrderDetails.trackingNumber"><strong>เลขติดตามพัสดุ:</strong>
                            <a :href="`https://track.thailandpost.co.th/?trackNumber=${selectedOrderDetails.trackingNumber}`" target="_blank">{{ selectedOrderDetails.trackingNumber }} <v-icon small>mdi-open-in-new</v-icon></a>
                        </p>
                    </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <h3 class="text-h6 mb-3">รายการสินค้า</h3>
                <v-simple-table dense>
                    <template v-slot:default>
                        <thead>
                            <tr>
                                <th class="text-left">สินค้า</th>
                                <th class="text-left">จำนวน</th>
                                <th class="text-right">ราคาต่อหน่วย</th>
                                <th class="text-right">ราคารวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in selectedOrderDetails.products" :key="item.product ? item.product._id : item.productId">
                                <td>
                                    <v-list-item dense class="pa-0">
                                        <v-list-item-avatar v-if="item.product && item.product.images && item.product.images.length > 0">
                                            <v-img :src="getProductImage(item.product)" alt="Product Image"></v-img>
                                        </v-list-item-avatar>
                                        <v-list-item-avatar v-else>
                                            <v-icon>mdi-image-off</v-icon>
                                        </v-list-item-avatar>
                                        <v-list-item-content>
                                            <v-list-item-title class="font-weight-medium">{{ item.product ? item.product.name : '[สินค้าไม่ระบุชื่อ]' }}</v-list-item-title>
                                            <v-list-item-subtitle v-if="item.product">ID: {{ item.product._id }}</v-list-item-subtitle>
                                            <v-list-item-subtitle v-else class="red--text">ID: {{ item.productId }} (ไม่พบข้อมูล)</v-list-item-subtitle>
                                        </v-list-item-content>
                                    </v-list-item>
                                </td>
                                <td>{{ item.quantity }}</td>
                                <td class="text-right">{{ item.price.toLocaleString() }} บาท</td>
                                <td class="text-right">{{ (item.quantity * item.price).toLocaleString() }} บาท</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" class="text-right font-weight-bold text-h6">ยอดรวม:</td>
                                <td class="text-right font-weight-bold text-h6 primary--text">{{ selectedOrderDetails.total.toLocaleString() }} บาท</td>
                            </tr>
                        </tfoot>
                    </template>
                </v-simple-table>

                <v-divider class="my-4"></v-divider>

                <h3 class="text-h6 mb-2">ประวัติสถานะ</h3>
                <v-timeline v-if="selectedOrderDetails.statusHistory && selectedOrderDetails.statusHistory.length > 0" dense clipped>
                    <v-timeline-item
                        v-for="(history, i) in selectedOrderDetails.statusHistory"
                        :key="i"
                        :color="getStatusColor(history.status)"
                        small
                        fill-dot
                    >
                        <v-row class="pt-1">
                            <v-col cols="3">
                                <strong>{{ formatDate(history.timestamp) }}</strong>
                            </v-col>
                            <v-col>
                                เปลี่ยนสถานะเป็น <v-chip :color="getStatusColor(history.status)" dark small>{{ getStatusText(history.status) }}</v-chip>
                            </v-col>
                        </v-row>
                    </v-timeline-item>
                </v-timeline>
                <p v-else class="text--secondary">ไม่พบประวัติการเปลี่ยนแปลงสถานะสำหรับคำสั่งซื้อนี้</p>
            </v-card-text>
        </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      orders: [],
      loading: false,
      search: '',
      detailsDialog: false,
      selectedOrderDetails: null,
      headers: [
        { text: 'หมายเลขคำสั่งซื้อ', value: '_id' },
        { text: 'สินค้าที่สั่ง', value: 'products', sortable: false },
        { text: 'ราคารวม', value: 'total' },
        { text: 'สถานะคำสั่งซื้อ', value: 'status' },
        { text: 'วันที่สั่งซื้อ', value: 'createdAt' },
        { text: 'จัดการ', value: 'actions', sortable: false }
      ],
      statusOptions: [
        { text: 'รอดำเนินการ', value: 'pending' },
        { text: 'กำลังดำเนินการ', value: 'processing' },
        { text: 'กำลังจัดส่ง', value: 'shipped' },
        { text: 'จัดส่งแล้ว', value: 'delivered' },
        { text: 'สำเร็จ', value: 'completed' },
        { text: 'ยกเลิก', value: 'cancelled' }
      ],
      paymentStatuses: [
        { text: 'รอดำเนินการ', value: 'pending' },
        { text: 'ชำระแล้ว', value: 'paid' },
        { text: 'ล้มเหลว', value: 'failed' },
        { text: 'คืนเงินแล้ว', value: 'refunded' }
      ],
      snackbar: {
        show: false,
        message: '',
        color: '',
        icon: ''
      }
    };
  },
  async created() {
    this.checkLoginAndRole();
    await this.fetchUserOrders();
  },
  methods: {
    checkLoginAndRole() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.showSnackbar('กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ', 'error');
        this.$router.push('/login');
        return;
      }
    },
    showSnackbar(message, type = 'success') {
      this.snackbar.message = message;
      this.snackbar.color = type === 'success' ? 'green' : (type === 'error' ? 'red' : 'orange');
      this.snackbar.icon = type === 'success' ? 'mdi-check-circle' : (type === 'error' ? 'mdi-alert-circle' : 'mdi-information');
      this.snackbar.show = true;
    },
    getProductImage(product) {
      if (product.images && product.images.length > 0) {
        const imageUrl = product.images[0];
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          return imageUrl;
        }
        return `http://localhost:3000${imageUrl}`;
      }
      return `https://via.placeholder.com/60x60/F5F5F5/BDBDBD?text=No+Img`; // Placeholder
    },
    async fetchUserOrders() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        // ตรวจสอบว่า API นี้คืนค่า Order ของ User ที่ Login อยู่
        const res = await axios.get('http://localhost:3000/api/v1/orders', { // API ที่ถูกออกแบบมาสำหรับดึงคำสั่งซื้อของ User ที่ล็อกอิน
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // สมมติว่า API /my-orders คืนค่าเป็น Array ของ Order Objects โดยตรง
        // และแต่ละ Order Object มีการ populate ข้อมูล product.name มาแล้ว
        this.orders = res.data;

      } catch (err) {
        console.error('โหลดประวัติการสั่งซื้อไม่สำเร็จ:', err.response ? err.response.data : err.message);
        const errorMessage = err.response && err.response.data && err.response.data.message
                               ? err.response.data.message
                               : 'เกิดข้อผิดพลาดในการโหลดประวัติการสั่งซื้อ';
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
        case 'processing': return 'purple darken-1';
        case 'shipped': return 'blue darken-2';
        case 'delivered': return 'green darken-2';
        case 'completed': return 'teal darken-1';
        case 'cancelled': return 'red darken-2';
        default: return 'grey';
      }
    },
    getStatusText(status) {
      const option = this.statusOptions.find(opt => opt.value === status);
      return option ? option.text : status;
    },
    getPaymentStatusColor(status) {
        switch (status) {
            case 'pending': return 'orange darken-1';
            case 'paid': return 'green darken-1';
            case 'failed': return 'red darken-1';
            case 'refunded': return 'blue-grey lighten-1';
            default: return 'grey';
        }
    },
    getPaymentStatusText(status) {
        const option = this.paymentStatuses.find(opt => opt.value === status);
        return option ? option.text : status;
    },
    formatDate(dateString) {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('th-TH', options);
    },
    async viewOrderDetails(orderId) { // เปลี่ยนเป็นรับ orderId โดยตรง
        this.loading = true;
        try {
            const token = localStorage.getItem('token');
            // เรียก API สำหรับดึงรายละเอียดคำสั่งซื้อเดี่ยวๆ
            const res = await axios.get(`http://localhost:3000/api/v1/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // สมมติว่า API /orders/:orderId คืนค่า Object ของ Order ที่มีการ populate ข้อมูล user, shippingAddress, และ products.product มาแล้ว
            this.selectedOrderDetails = res.data.data; 
            this.detailsDialog = true;

        } catch (err) {
            console.error('โหลดรายละเอียดคำสั่งซื้อไม่สำเร็จ:', err.response ? err.response.data : err.message);
            const errorMessage = err.response && err.response.data && err.response.data.message
                                   ? err.response.data.message
                                   : 'เกิดข้อผิดพลาดในการโหลดรายละเอียดคำสั่งซื้อ';
            this.showSnackbar(errorMessage, 'error');
            if (err.response && err.response.status === 401) {
              this.$router.push('/login');
            }
        } finally {
            this.loading = false;
        }
    }
  }
};
</script>

<style scoped>
.v-container {
  max-width: 1200px;
}

.order-user-table >>> th {
  font-size: 1rem !important;
  font-weight: bold;
  color: #424242 !important; /* Grey 800 */
}

.order-user-table >>> td {
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