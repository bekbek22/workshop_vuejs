<template>
  <v-container fill-height fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="success" dark flat>
            <v-toolbar-title>สมัครสมาชิก</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="register" ref="registerForm">
              <v-text-field
                label="ชื่อผู้ใช้"
                v-model="username"
                prepend-icon="mdi-account"
                :rules="[rules.required]"
                required
              />
              <v-text-field
                label="อีเมล"
                v-model="email"
                prepend-icon="mdi-email"
                :rules="[rules.required, rules.email]"
                required
              />
              <v-text-field
                label="รหัสผ่าน"
                v-model="password"
                prepend-icon="mdi-lock"
                type="password"
                :rules="[rules.required, rules.min]"
                required
              />
              <v-btn color="success" type="submit" block class="mt-4">สมัครสมาชิก</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.success" :timeout="3000" color="success" bottom right>
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="snackbar.success = false">
          ปิด
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar v-model="snackbar.error" :timeout="3000" color="error" bottom right>
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="snackbar.error = false">
          ปิด
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  data: () => ({
    username: '',
    email: '',
    password: '',
    snackbar: { // เพิ่มตัวแปรสำหรับควบคุม Snackbar
      success: false,
      error: false,
      message: '',
    },
    rules: { // เพิ่มกฎสำหรับการตรวจสอบความถูกต้องของข้อมูล
      required: value => !!value || 'จำเป็นต้องกรอก',
      min: v => v.length >= 6 || 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      email: value => {
        const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return pattern.test(value) || 'รูปแบบอีเมลไม่ถูกต้อง'
      },
    },
  }),
  methods: {
    async register() {
      // ตรวจสอบความถูกต้องของฟอร์มก่อนส่ง
      if (!this.$refs.registerForm.validate()) {
        this.snackbar.message = 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง';
        this.snackbar.error = true;
        return;
      }

      try {
        await axios.post('http://localhost:3000/api/v1/register', {
          username: this.username,
          email: this.email,
          password: this.password,
        });

        // แสดง Snackbar แจ้งเตือนเมื่อสมัครสำเร็จ
        this.snackbar.message = 'สมัครสมาชิกสำเร็จแล้ว! คุณสามารถเข้าสู่ระบบได้ทันที';
        this.snackbar.success = true;

        // หน่วงเวลาเล็กน้อยก่อนเปลี่ยนหน้า เพื่อให้ผู้ใช้เห็น Snackbar
        setTimeout(() => {
          this.$router.push('/login');
        }, 1500); // เปลี่ยนหน้าหลังจาก 1.5 วินาที

      } catch (err) {
        // แสดง Snackbar แจ้งเตือนเมื่อสมัครไม่สำเร็จ
        this.snackbar.message = 'สมัครสมาชิกไม่สำเร็จ: ' + (err.response ? err.response.data.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
        this.snackbar.error = true;
      }
    },
  },
};
</script>

<style scoped>
</style>