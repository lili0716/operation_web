<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { Button, Layout, message, Tree } from 'ant-design-vue';
import { onMounted, ref } from 'vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDeptList, getUserList } from '#/api/system';

const { Sider, Content } = Layout;
const deptTreeData = ref<any[]>([]);

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'username', title: '用户名' },
      { field: 'nickname', title: '昵称' },
      { field: 'realName', title: '真实姓名' },
      { field: 'roles', title: '所属角色' },
      { field: 'status', title: '状态' },
      { field: 'createTime', title: '创建时间' },
      { field: 'action', title: '操作', width: 120, slots: { default: 'action' } },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          const res = await getUserList({
            page: page.currentPage,
            pageSize: page.pageSize,
          });
          return {
            items: res.records || [],
            total: res.total || 0,
          };
        },
      },
    },
    pagerConfig: {},
    rowConfig: {
      keyField: 'id',
    },
  },
});

const fetchDeptTree = async () => {
  try {
    const list = await getDeptList();
    const map: Record<string, any> = {};
    const tree: any[] = [];

    // Flat to Tree mapping
    list.forEach((item: any) => {
      map[item.id] = {
        ...item,
        key: item.id,
        title: item.deptName,
        children: [],
      };
    });

    list.forEach((item: any) => {
      if (item.parentId === 0 || !item.parentId) {
        tree.push(map[item.id]);
      } else if (map[item.parentId]) {
        map[item.parentId].children.push(map[item.id]);
      }
    });

    deptTreeData.value = tree;
  } catch (error) {
    console.error(error);
    message.error('加载部门树失败');
  }
};

onMounted(() => {
  fetchDeptTree();
});
</script>

<template>
  <Page title="账号管理">
    <Layout class="bg-background rounded-md h-full">
      <Sider width="240" class="bg-background border-r p-4" theme="light">
        <h3 class="mb-4 font-bold text-md">部门组织树</h3>
        <Tree
          v-if="deptTreeData.length > 0"
          :tree-data="deptTreeData"
          default-expand-all
        />
        <div v-else class="text-gray-400 text-sm mt-4 text-center">
          暂无部门数据
        </div>
      </Sider>
      <Content class="bg-background">
        <Grid>
          <template #toolbar-actions>
            <Button type="primary">新增账号</Button>
          </template>
        </Grid>
      </Content>
    </Layout>
  </Page>
</template>
