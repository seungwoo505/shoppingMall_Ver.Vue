<template>
  <h1>회원 탈퇴</h1>
  <form @submit.prevent="deleteAccount">
    <label>비밀번호 확인</label>
    <input
        id="password"
        type="password"
        v-model="password"
        placeholder="비밀번호 입력"
        required
    />
    <button type="submit">탈퇴하기</button>
  </form>
</template>

<script setup>
  import {ref} from "vue";
  import store from "@/store";

  const password = ref("");

  const deleteAccount = async () => {
    try {
      const response = fetch("https://seungwoo.i234.me:3333/deleteAccount", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: store.state.userId,
          password: password.value
        })
      });

      const data = await response.json();
      console.log(data.message);
      if(data.success) store.commit("logout");
    }catch (error) {
      console.error("서버에 오류가 발생했습니다. ", error);
      alert("서버 오류가 발생했습니다.");
    }
  }
</script>

<style scoped lang="css">

</style>