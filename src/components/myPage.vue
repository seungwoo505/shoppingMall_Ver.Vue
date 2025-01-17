<template>
    <div>
      <h1>추가 인증</h1>
      <form @submit.prevent="getUserInfo" v-if="user === null">
        <div>
          <label for="password">비밀번호</label>
          <input id="password" v-model="password" type="password" placeholder="비밀번호를 입력해주세요."/>
        </div>
        <button type="submit">확인</button>
      </form>

      <div v-else>
        <h2>사용자 정보</h2>
        <p>이름 : {{ user.NICKNAME}}</p>
        <p>이메일 : {{ user.EMAIL }}</p>
        <button @click="changePassword">비밀번호 변경</button>
        <button @click="deleteAccount">탈퇴하기</button>
      </div>
    </div>
</template>

<script setup lang="js">
import {ref} from "vue";
import router from "@/router";
import store from "@/store";

const password = ref("");
const user = ref(null);

const getUserInfo = async () => {
  try {
    const response = await fetch("https://seungwoo.i234.me:3333/checkPassword", {
      method : "POST",
      headers : {
        "Content-Type" : "application/json"
      },
      body : JSON.stringify({
        userId : store.state.userId,
        password : password.value
      })
    });

    const data = await response.json();
    alert(data.message);
    if(data.success) {
      user.value = data.user;
      password.value = "";
    }
    else user.value = null;

  }catch(error){
    console.error("서버 오류가 발생했습니다. : ", error);
    alert("서버 오류가 발생했습니다.");
  }
}

const changePassword = () => {
  router.push("/changePassword");
}

const deleteAccount = () => {
  if(!confirm("정말로 회원을 탈퇴하실건가요?")) return;

  router.push("/deleteAccount");
}

</script>