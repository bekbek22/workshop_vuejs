<template>
  <v-container class="my-5">
    <h2 class="text-h4 text-center mb-6 font-weight-bold primary--text">
      <v-icon large left>mdi-account-clock-outline</v-icon> รายการผู้ใช้ที่รออนุมัติ (Admin)
    </h2>

    <v-card class="elevation-4 pa-4 mb-6">
      <v-card-title class="pa-0">
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="ค้นหาผู้ใช้..."
          single-line
          hide-details
          clearable
          outlined
          dense
        ></v-text-field>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="pendingUsers"
        :search="search"
        item-key="_id"
        class="elevation-1 user-admin-table"
        :loading="loading"
        loading-text="กำลังโหลดผู้ใช้..."
        no-data-text="ไม่พบผู้ใช้ที่รออนุมัติ"
      >
        <template v-slot:item.role="{ item }">
          <v-chip color="blue-grey lighten-3" small>{{ item.role }}</v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            color="success"
            small
            class="text-white font-weight-bold"
            rounded
            elevation="1"
            @click="openApproveConfirm(item)"
          >
            <v-icon left>mdi-check-circle-outline</v-icon>
            อนุมัติ
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5 green--text">
          ยืนยันการอนุมัติ
        </v-card-title>
        <v-card-text class="py-4">
          คุณต้องการอนุมัติผู้ใช้ "<span class="font-weight-bold">{{ selectedUser.username }}</span>" ใช่หรือไม่?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="confirmDialog = false">ยกเลิก</v-btn>
          <v-btn color="success" text @click="executeApprove">ตกลง</v-btn>
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
      pendingUsers: [],
      loading: false, // สำหรับแสดง loading state
      search: '', // สำหรับค้นหา
      confirmDialog: false, // ควบคุมการเปิด/ปิด Dialog ยืนยัน
      selectedUser: {}, // เก็บข้อมูลผู้ใช้ที่เลือกเพื่ออนุมัติ
      snackbar: {
        show: false,
        message: '',
        color: '',
        icon: ''
      },
      headers: [
        { text: 'ชื่อผู้ใช้', value: 'username' },
        { text: 'อีเมล', value: 'email' },
        { text: 'บทบาท', value: 'role' },
        { text: 'การจัดการ', value: 'actions', sortable: false }
      ]
    };
  },
  async created() {
    this.checkAdmin();
    await this.fetchUsers();
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
    async fetchUsers() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        // *** แก้ไข: ใช้ Relative Path เหมือนโค้ดเก่า และเป็น '/users' แทน '/users/pending' ***
        const res = await axios.get('/users', { 
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // *** แก้ไข: เข้าถึงข้อมูล pendingUsers จาก res.data.data.pendingUsers ***
        this.pendingUsers = res.data.data?.pendingUsers || []; 

      } catch (err) {
        console.error('โหลดผู้ใช้ไม่สำเร็จ:', err.response ? err.response.data : err.message);
        const errorMessage = err.response && err.response.data && err.response.data.message 
                             ? err.response.data.message 
                             : 'เกิดข้อผิดพลาดในการโหลดผู้ใช้ที่รออนุมัติ';
        this.showSnackbar(errorMessage, 'error');
        if (err.response && err.response.status === 401) {
          this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },
    openApproveConfirm(user) {
      this.selectedUser = { ...user }; // คัดลอกข้อมูลผู้ใช้เพื่อไม่ให้กระทบกับตารางโดยตรง
      this.confirmDialog = true;
    },
    async executeApprove() {
      this.confirmDialog = false; // ปิด Dialog ยืนยัน
      const userId = this.selectedUser._id;
      try {
        const token = localStorage.getItem('token');
        // ใช้ Absolute URL สำหรับการอนุมัติ เพื่อความชัดเจน หาก Backend มี endpoint แยกกัน
        // หรือถ้า Backend ใช้ Relative Path ตาม baseURL ก็เปลี่ยนเป็น `/users/${userId}/approve`
        await axios.put(`http://localhost:3000/api/v1/users/${userId}/approve`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        this.showSnackbar(`อนุมัติผู้ใช้ "${this.selectedUser.username}" สำเร็จ`, 'success');
        await this.fetchUsers(); // โหลดรายการผู้ใช้ใหม่หลังจากอนุมัติ
      } catch (err) {
        console.error('อนุมัติไม่สำเร็จ:', err.response ? err.response.data : err.message);
        const errorMessage = err.response && err.response.data && err.response.data.message 
                             ? err.response.data.message 
                             : 'เกิดข้อผิดพลาดในการอนุมัติผู้ใช้';
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
  max-width: 900px;
}

.user-admin-table >>> th {
  font-size: 1rem !important;
  font-weight: bold;
  color: #424242 !important; /* Grey 800 */
}

.user-admin-table >>> td {
  font-size: 0.95rem;
  vertical-align: middle;
}
</style>