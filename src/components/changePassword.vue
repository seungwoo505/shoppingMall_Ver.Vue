<template>
  <div>
    <h1>비밀번호 변경</h1>
    <form @submit.prevent="changePassword">
      <label for="currentPassword">현재 비밀번호</label>
      <input
          id="currentPassword"
          type="password"
          v-model="currentPassword"
          placeholder="현재 비밀번호 입력"
          required
      />

      <label for="newPassword">새 비밀번호</label>
      <input
          id="newPassword"
          type="password"
          v-model="newPassword"
          placeholder="새 비밀번호"
          required
      />

      <label for="confirmPassword">새 비밀번호 확인</label>
      <input
          id="confirmPassword"
          type="password"
          v-model="confirmPassword"
          placeholder="새 비밀번호 확인"
          required
      />

      <button type="submit">변경하기</button>
    </form>
  </div>
</template>

<script setup>
  import {ref} from "vue";
  import store from "@/store";

  const currentPassword = ref("");//현 비밀번호
  const newPassword = ref("");//새 비밀번호
  const confirmPassword = ref("");//새 비밀번호 확인

  const changePassword = async () => {
    if(currentPassword.value === newPassword.value) {
      alert("현 비밀번호와 새로운 비밀번호가 일치합니다.");
      return;
    }

    if(newPassword.value !== confirmPassword.value) {
      alert("새 비밀번호와 새 비밀번호 확인이 일치하지않습니다.");
      return;
    }

    try{
      const response = await fetch("https://seungwoo.i234.me:3333/changePassword", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          userId: store.state.userId,
          currentPassword: currentPassword.value,
          newPassword: newPassword.value
        })
      });

      const data = await response.json();
      alert(data.message);

      if(data.success) store.commit("logout");
    }catch (error) {
      console.error("서버 오류가 발생했습니다. ", error);
      alert("서버 오류가 발생했습니다.");
    }
  }
</script>

<style scoped lang="css">

</style>