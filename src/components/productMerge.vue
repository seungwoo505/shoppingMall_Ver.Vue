<template>
    <div class="product-form">
        <h1>{{ isEditMode ? "상품 수정" : "상품 등록"}}</h1>
        <form @submit.prevent="handleSubmit">
            <div>
                <label for="title">제목</label>
                <input v-model="product.TITLE" id="title" type="text" placeholder="프로젝트 제목을 입력하세요" required/>
            </div>

            <div>
                <label for="description">내용</label>
                <textarea
                    v-model="product.DESCRIPTION"
                    id="description"
                    placeholder="프로젝트 설명을 입력하세요."
                    rows="5"
                    required
                ></textarea>
            </div>

            <div>
                <label for="skills">개발 스킬 (해시태그)</label>
                <input
                    v-model="skillInput"
                    id="skills"
                    type="text"
                    placeholder="#JavaScript, #Vue"
                    @keydown.enter.prevent="addSkill"
                />

                <div class="hashtags">
                    <span v-for="(skill, index) in product.SKILLS" :key="index" class="hashtag">
                        {{ skill }}
                        <button @click="removeSkill(index)">x</button>
                    </span>
                </div>
            </div>

            <div>
                <label for="images">이미지 첨부</label>
                <input type="file" id="images" multiple @change="uploadImage" accept="image/*"/>
            </div>

            <div v-if="previewImages.length">
                <h3>이미지 미리보기</h3>
                <div v-for="(image, index) in previewImages" :key="index" class="preview-container">
                    <img :src="image" alt="미리보기 이미지"/>
                    <button type="button" @click="removeImage(index)">삭제</button>
                </div>
            </div>

            <button type="submit">{{ isEditMode ? "수정하기" : "등록하기"}}</button>
        </form>
    </div>
</template>

<script setup lang="js">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const isEditMode = ref(!!route.params.id);
const product = ref({
    TITLE : "",
    DESCRIPTION : "",
    SKILLS : [],
    IMAGES : []
});

const skillInput = ref("");
const previewImages = ref([]);

const addSkill = () => {
    const skill = skillInput.value.trim();

    if(skill && !product.value.SKILLS.includes(skill)) product.value.SKILLS.push('#' + skill);

    skillInput.value = "";
};

const removeSkill = (index) => {
    product.value.SKILLS.splice(index, 1);
};

const uploadImage = (event) => {
    const files = Array.from(event.target.files);
    files.forEach((file) =>{
        product.value.IMAGES.push(file);
        previewImages.value.push(URL.createObjectURL(file));
    });
};

const removeImage = (index) => {
    product.value.IMAGES.splice(index, 1);
    previewImages.value.splice(index, 1);
};

const handleSubmit = async () => {
    const formData = new FormData();

    formData.append("TITLE", product.value.TITLE);
    formData.append("DESCRIPTION", product.value.DESCRIPTION);
    product.value.SKILLS.forEach((file) => formData.append('SKILLS', file));
    product.value.IMAGES.forEach((file) => formData.append('images', file));

    try {
        const response = await fetch(`https://seungwoo.i234.me:3333/product/merge${isEditMode.value ? ('/' + route.params.id) : ''}`, {
            method : isEditMode.value ? "PUT" : "POST",
            body : formData
        });

        const data = await response.json();
        alert(data.message);
        if(response.ok) router.push(`/product/${data.productId}`); // 성공 후 상품 페이지로 이동
    } catch (error) {
        console.error("상품 저장/수정 오류 : ", error);
        alert("오류가 발생했습니다. 다시 시도해주세요");
    }
};

const fetchProduct = async () => {
    try {
        const response = await fetch(`https://seungwoo.i234.me:3333/product/${route.params.id}`);
        const data = await response.json();

        if(response.ok){
            product.value = data.product;
            product.value.SKILLS = JSON.parse(product.value.SKILLS);
            product.value.IMAGES = JSON.parse(product.value.IMAGES);
            previewImages.value = Array.from(product.value.IMAGES);
        }else {
            alert(data.message);
        }

    } catch (error) {
        console.error("상품 상세 불러오기 실패");
    }
};

onMounted(() => {
    if(isEditMode.value) fetchProduct();
});
</script>

<style lang="css" scoped>
.product-form {
  max-width: 800px;
  margin: auto;
}

.hashtags {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.preview-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.preview-container img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>