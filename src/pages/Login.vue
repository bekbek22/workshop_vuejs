<template>
  <v-container fill-height fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>เข้าสู่ระบบ</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="login">
              <v-text-field
                label="อีเมล หรือ ชื่อผู้ใช้"
                v-model="identifier"
                prepend-icon="mdi-account"
                type="text"
                required
              />
              <v-text-field
                label="รหัสผ่าน"
                v-model="password"
                prepend-icon="mdi-lock"
                type="password"
                required
              />
              <v-btn color="primary" type="submit" block class="mt-4">เข้าสู่ระบบ</v-btn>
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
    identifier: '',
    password: '',
    snackbar: {
      success: false,
      error: false,
      message: '',
    },
  }),
  methods: {
    async login() {
      try {
        const res = await axios.post('http://localhost:3000/api/v1/login', {
          identifier: this.identifier,
          password: this.password,
        });

        // Dispatch login action
        this.$store.dispatch('login', res.data.access_token);

        // Show success snackbar
        this.snackbar.message = 'เข้าสู่ระบบสำเร็จ!';
        this.snackbar.success = true;

        // Redirect after a short delay to allow snackbar to be seen
        setTimeout(() => {
          this.$router.push('/');
        }, 1500); // Redirect after 1.5 seconds

      } catch (err) {
        // Show error snackbar
        this.snackbar.message = 'เข้าสู่ระบบไม่สำเร็จ: ' + (err.response ? err.response.data.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
        this.snackbar.error = true;
      }
    },
  },
};
</script>

<style scoped>
</style>