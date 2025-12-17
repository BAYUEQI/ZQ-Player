<!-- 用户协议 -->
<template>
  <n-modal
    class="user-agreement"
    preset="card"
    v-model:show="showModal"
    :mask-closable="false"
    :closable="false"
    transform-origin="center"
    style="max-width: 70vw"
  >
    <n-h1 class="title">用户协议</n-h1>
    <n-scrollbar class="scrollbar">
      <n-flex class="date" justify="center">
        <n-tag round>生效日期：2025 年 5 月 10 日</n-tag>
        <n-tag type="warning" round>更新日期：2025 年 5 月 10 日</n-tag>
      </n-flex>
      <n-p>
        欢迎使用 ZQ-Player（以下简称"本网站"）。本网站是一个本地音乐播放网站，可能会调用第三方 API
        来增强其功能。请在使用本网站前仔细阅读本用户协议。本协议是您（以下简称"用户"）与 ZQ-Player
        开发团队（以下简称“开发者”）之间的法律协议。一旦您下载、安装或使用本网站，即表示您同意接受本协议的所有条款和条件。
      </n-p>
      <n-h3 prefix="bar"> 网站使用 </n-h3>
      <n-ol>
        <n-li>本网站是一款在线音乐播放网站，允许用户播放存储于第三方数据库的音频文件。</n-li>
        <n-li>开发者保留随时修改、更新或终止网站及其功能的权利，而无需提前通知用户。</n-li>
        <n-li>用户必须年满 18 岁或在父母或监护人的监督下使用本网站。</n-li>
      </n-ol>
      <n-h3 prefix="bar"> 开源许可 </n-h3>
      <n-ol>
        <n-li>本网站是基于 AGPL-3.0 许可发布的开源网站。</n-li>
        <n-li>用户在使用、修改和分发 ZQ-Player 时，必须遵守 AGPL-3.0 许可的条款和条件。</n-li>
        <n-li>
          AGPL-3.0 许可的详细信息可以在以下链接找到：
          <n-a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank">
            GNU Affero General Public License v3.0
          </n-a>
        </n-li>
      </n-ol>
      <n-h3 prefix="bar"> 第三方 </n-h3>
      <n-ol>
        <n-li>本网站可能会调用第三方 API 以提供额外功能（例如，歌词显示、专辑封面获取等）。</n-li>
        <n-li>
          开发者不对第三方 API 的准确性、完整性或合法性负责。用户使用第三方 API
          时，应遵守第三方提供商的服务条款和隐私政策。
        </n-li>
        <n-li>由于第三方 API 引起的任何问题或纠纷，开发者不承担任何责任。</n-li>
      </n-ol>
      <n-h3 prefix="bar"> 用户责任 </n-h3>
      <n-ol>
        <n-li>
          用户应遵守所有适用的法律法规，确保通过合法手段获取音乐文件，并在使用本网站时不侵犯任何第三方的版权或其他合法权益。
        </n-li>
        <n-li>
          用户不得使用本网站进行任何非法活动，包括但不限于侵犯版权、传播恶意网站、非法获取数据等。
        </n-li>
      </n-ol>
      <n-h3 prefix="bar"> 知识产权 </n-h3>
      <n-ol>
        <n-li>
          除了根据 AGPL-3.0
          许可使用的开源部分外，本网站及其所有内容（包括但不限于网站、标识、图形、用户界面、脚本和服务名称）均为开发者或其许可方的财产，受知识产权法保护。
        </n-li>
        <n-li> 未经开发者书面许可，用户不得复制、修改、分发、出售或租赁本网站及其内容。 </n-li>
      </n-ol>
      <n-h3 prefix="bar"> 免责声明 </n-h3>
      <n-ol>
        <n-li>
          本网站按“现状”提供，不提供任何形式的明示或暗示保证，包括但不限于适销性、特定用途适用性和非侵权性。
        </n-li>
        <n-li>
          开发者不保证本网站的功能不会中断或无错误，也不保证本网站适用于用户的特定需求。
        </n-li>
        <n-li> 用户使用本网站过程中产生的任何直接或间接损失，开发者不承担任何责任。 </n-li>
      </n-ol>
      <n-h3 prefix="bar"> 责任限制 </n-h3>
      <n-ol>
        <n-li>
          在适用法律允许的最大范围内，开发者对因使用或无法使用本网站而导致的任何间接、偶然、特殊、继发或惩罚性损害不承担责任，即使开发者已被告知此类损害的可能性。
        </n-li>
        <n-li>
          在任何情况下，开发者对用户的全部责任，不论是合同、侵权（包括过失）或其他方面的责任，总额不超过用户为使用本网站所支付的费用（如果有）。
        </n-li>
      </n-ol>
      <n-h3 prefix="bar"> 终止 </n-h3>
      <n-ol>
        <n-li> 开发者有权在不提前通知的情况下，因任何原因或无原因终止本协议。 </n-li>
        <n-li> 本协议终止后，用户应停止使用本网站并删除其所有副本。 </n-li>
      </n-ol>
      <n-h3 prefix="bar"> 隐私政策 </n-h3>
      <n-ol>
        <n-li> 本网站可能会收集和使用用户的某些信息，以提供和改进网站服务。 </n-li>
        <n-li>
          开发者承诺保护用户的隐私，不会将用户信息出售给第三方。详细的隐私政策请参考我们的隐私声明。
        </n-li>
      </n-ol>
      <n-h3 prefix="bar"> 更新与变更 </n-h3>
      <n-ol>
        <n-li> 开发者保留随时更新和修改本协议的权利。 </n-li>
        <n-li>
          更新后的协议将通过适当的方式通知用户，包括但不限于在本网站中发布或通过电子邮件发送通知。
        </n-li>
      </n-ol>
      <n-h3 prefix="bar"> 其他 </n-h3>
      <n-ol>
        <n-li> 本协议受中华人民共和国法律管辖，不考虑其法律冲突条款。</n-li>
        <n-li>
          如果本协议的任何条款被视为无效或不可执行，该条款将被修改以反映双方的意图，其余条款仍然完全有效。
        </n-li>
        <n-li>
          本协议构成您与开发者之间关于使用本网站的完整协议，并取代之前的所有口头或书面协议和陈述。
        </n-li>
      </n-ol>
      <n-card ref="readOverRef">
        若你（使用者）接受以上协议，请点击下面的“同意并使用”按钮签署本协议，若不接受，请点击“不同意”后网站将退出并清除本网站的所有数据。
      </n-card>
    </n-scrollbar>
    <template #action>
      <n-flex justify="center">
        <n-button v-if="isElectron" type="error" @click="closeApp">不同意</n-button>
        <n-button type="success" @click="close" :disabled="!isReadOver">
          {{ isReadOver ? "同意并使用" : "请先完整阅读" }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { checkPlatform } from "@/utils/helper";
import { useElementVisibility } from "@vueuse/core";
import { ref } from 'vue';
import { useMessage } from 'naive-ui';
import { siteSettings } from "@/stores"

const settings = siteSettings();
const message = useMessage();
const showModal = ref(true);
const close = () => {
  showModal.value = false;
  settings.readProtocol = true;
  // 保存到 localStorage
  const storedSettings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
  storedSettings.readProtocol = true;
  localStorage.setItem('siteSettings', JSON.stringify(storedSettings));
  message.success("感谢您同意使用本网站！");
};

const readOverRef = ref<HTMLElement | null>(null);
const isElectron = checkPlatform.electron();
// 是否阅读完毕
const isReadOver = useElementVisibility(readOverRef);

// 关闭网站
const closeApp = () => {
  message.error("该功能已禁用!")
};

</script>

<style lang="scss" scoped>
.user-agreement {
  :deep(.scrollbar) {
    max-height: 60vh;
    margin-bottom: 20px;
    .n-scrollbar-content {
      overflow: hidden;
      padding-right: 12px;
    }
  }
  .title {
    text-align: center;
  }
  .n-p {
    font-size: 16px;
    text-indent: 2em;
  }
  .n-ol {
    font-size: 16px;
  }
  .n-card {
    --n-font-size: 18px;
    --n-border-radius: 12px;
    margin-top: 20px;
    margin-bottom: 20px;
  }
}
</style>