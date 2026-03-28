<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  RadioButton,
  RadioGroup,
  Space,
  Table,
  Tag,
  Textarea,
  TreeSelect,
} from 'ant-design-vue';
import { computed, h, onMounted, reactive, ref } from 'vue';

import {
  addDept,
  deleteDept,
  getDeptList,
  updateDept,
} from '#/api/system';

// ==================== State ====================
const loading = ref(false);
const dataSource = ref<any[]>([]);
const flatList = ref<any[]>([]);
const expandedRowKeys = ref<(number | string)[]>([]);

// Modal state
const modalVisible = ref(false);
const modalTitle = ref('新增部门');
const formState = reactive({
  id: undefined as number | undefined,
  deptName: '',
  parentId: 0 as number | undefined,
  orderNo: 0,
  status: 1,
  remark: '',
});

// ==================== Table Columns ====================
const columns = [
  {
    title: '部门名称',
    dataIndex: 'deptName',
    key: 'deptName',
    width: 200,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '排序',
    dataIndex: 'orderNo',
    key: 'orderNo',
    width: 80,
    align: 'center' as const,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180,
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    align: 'center' as const,
  },
];

// ==================== Computed ====================
// Tree data for the parent selector (TreeSelect)
const parentTreeData = computed(() => {
  const topNode = { key: 0, value: 0, title: '顶级部门', children: [] as any[] };
  topNode.children = buildTreeForSelect(dataSource.value);
  return [topNode];
});

function buildTreeForSelect(list: any[]): any[] {
  return list.map((item: any) => ({
    key: item.id,
    value: item.id,
    title: item.deptName,
    children: item.children ? buildTreeForSelect(item.children) : [],
  }));
}

// ==================== Data Loading ====================
const fetchData = async () => {
  loading.value = true;
  try {
    const list = await getDeptList();
    flatList.value = list;
    dataSource.value = buildTree(list);
    // Expand all by default
    expandedRowKeys.value = list.map((item: any) => item.id);
  } catch (error) {
    console.error(error);
    message.error('加载部门数据失败');
  } finally {
    loading.value = false;
  }
};

function buildTree(list: any[]): any[] {
  const map: Record<string, any> = {};
  const tree: any[] = [];

  list.forEach((item: any) => {
    map[item.id] = { ...item, key: item.id, children: [] };
  });

  list.forEach((item: any) => {
    if (item.parentId === 0 || !item.parentId) {
      tree.push(map[item.id]);
    } else if (map[item.parentId]) {
      map[item.parentId].children.push(map[item.id]);
    }
  });

  // Remove empty children arrays for leaf nodes
  const cleanChildren = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length === 0) {
        delete node.children;
      } else if (node.children) {
        cleanChildren(node.children);
      }
    });
  };
  cleanChildren(tree);

  return tree;
}

// ==================== Modal Operations ====================
function openAddModal(parentId?: number) {
  modalTitle.value = '新增部门';
  Object.assign(formState, {
    id: undefined,
    deptName: '',
    parentId: parentId ?? 0,
    orderNo: 0,
    status: 1,
    remark: '',
  });
  modalVisible.value = true;
}

function openEditModal(record: any) {
  modalTitle.value = '编辑部门';
  Object.assign(formState, {
    id: record.id,
    deptName: record.deptName,
    parentId: record.parentId ?? 0,
    orderNo: record.orderNo ?? 0,
    status: record.status ?? 1,
    remark: record.remark ?? '',
  });
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formState.deptName.trim()) {
    message.warning('请输入部门名称');
    return;
  }

  try {
    const data = {
      ...formState,
      parentId: formState.parentId ?? 0,
    };

    if (formState.id) {
      await updateDept(data);
      message.success('更新成功');
    } else {
      const { id, ...rest } = data;
      await addDept(rest);
      message.success('新增成功');
    }
    modalVisible.value = false;
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('操作失败');
  }
}

async function handleDelete(id: number) {
  try {
    await deleteDept(id);
    message.success('删除成功');
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('删除失败');
  }
}

// ==================== Lifecycle ====================
onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page title="部门管理" content-class="p-4">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <div />
      <Button type="primary" @click="openAddModal()">
        <template #icon>
          <span class="mr-1">+</span>
        </template>
        新增部门
      </Button>
    </div>

    <!-- Tree Table -->
    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :expanded-row-keys="expandedRowKeys"
      :pagination="false"
      row-key="id"
      size="middle"
      bordered
      @expand="
        (expanded: boolean, record: any) => {
          if (expanded) {
            expandedRowKeys.push(record.id);
          } else {
            expandedRowKeys = expandedRowKeys.filter((k) => k !== record.id);
          }
        }
      "
    >
      <template #bodyCell="{ column, record }">
        <!-- Status Column -->
        <template v-if="column.key === 'status'">
          <Tag :color="record.status === 1 ? 'success' : 'error'">
            {{ record.status === 1 ? '已启用' : '已禁用' }}
          </Tag>
        </template>

        <!-- Action Column -->
        <template v-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="openAddModal(record.id)">
              新增
            </Button>
            <Button type="link" size="small" @click="openEditModal(record)">
              编辑
            </Button>
            <Popconfirm
              title="确定要删除该部门吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record.id)"
            >
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <!-- Add/Edit Modal -->
    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :width="520"
      @ok="handleSubmit"
      ok-text="确认"
      cancel-text="取消"
      destroy-on-close
    >
      <Form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }" class="mt-6">
        <FormItem label="部门名称" required>
          <Input
            v-model:value="formState.deptName"
            placeholder="请输入"
            allow-clear
          />
        </FormItem>

        <FormItem label="上级部门">
          <TreeSelect
            v-model:value="formState.parentId"
            :tree-data="parentTreeData"
            placeholder="请选择"
            tree-default-expand-all
            allow-clear
          />
        </FormItem>

        <FormItem label="排序">
          <InputNumber
            v-model:value="formState.orderNo"
            :min="0"
            :max="9999"
            placeholder="请输入"
            class="w-full"
          />
        </FormItem>

        <FormItem label="状态">
          <RadioGroup v-model:value="formState.status" button-style="solid">
            <RadioButton :value="1">已启用</RadioButton>
            <RadioButton :value="0">已禁用</RadioButton>
          </RadioGroup>
        </FormItem>

        <FormItem label="备注">
          <Textarea
            v-model:value="formState.remark"
            placeholder="请输入"
            :rows="3"
            show-count
            :maxlength="200"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
