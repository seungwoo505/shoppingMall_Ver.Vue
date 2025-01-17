<template>
    <header>
        <div id="nav">
            <router-link to="/">홈</router-link>
            <router-link to="/products">상품</router-link>
            <router-link to="/basket">장바구니</router-link>
        </div>
        <div>
            <p v-if="store.state.loginOrNot">{{ store.state.nickname }}님 환영합니다.</p>
            <button v-if="store.state.loginOrNot" v-on:click="myPage">마이페이지</button>
            <button v-on:click="sessionCheck">세션 갱신</button>
            <button v-if="store.state.loginOrNot" v-on:click="logOut">로그아웃</button>
        </div>
    </header>
</template>

<script setup lang="js">
import router from '@/router';
import store from '@/store';

const myPage = () => {
    router.push("/mypage");
};

const sessionCheck = async () => {
  try {
    const session = await fetch("https://seungwoo.i234.me:3333/sessionCheck", {
      method: "POST",
      headers : {
        "Authorization": "Bearer " + store.state.session,
        "Content-Type" : "application/json"
      },
      body: JSON.stringify({userId : store.state.userId})
    });

    const data = await session.json();
    console.log(data.message);
    if(!data.success) {
      router.push("/");
    }
    else {
      store.state.session = data.session;
      alert("갱신 성공");
    }
  }catch (error){
    console.error(error);
    alert("서버에 문제가 발생했습니다.");
  }
}

const logOut = () => {
    store.commit("logout");
};
</script>