<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import {
  Button,
  Checkbox,
  Divider,
  Drawer,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Popconfirm,
  RadioButton,
  RadioGroup,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
  Textarea,
  TreeSelect,
} from 'ant-design-vue';
import { computed, onMounted, reactive, ref } from 'vue';

import {
  addMenu,
  deleteMenu,
  getMenuList,
  updateMenu,
} from '#/api/system';

// ==================== Constants ====================
const MENU_TYPE_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '目录', color: 'blue' },
  1: { label: '菜单', color: 'green' },
  2: { label: '按钮', color: 'orange' },
  3: { label: '内嵌', color: 'purple' },
  4: { label: '外链', color: 'cyan' },
};

// ==================== State ====================
const loading = ref(false);
const dataSource = ref<any[]>([]);
const flatList = ref<any[]>([]);
const expandedRowKeys = ref<(number | string)[]>([]);

// Drawer state
const drawerVisible = ref(false);
const drawerTitle = ref('新增菜单');
const formState = reactive({
  id: undefined as number | undefined,
  parentId: 0 as number | undefined,
  name: '',
  title: '',
  path: '',
  component: '',
  icon: '',
  activeIcon: '',
  activePath: '',
  permission: '',
  redirect: '',
  type: 0 as number,
  status: 1,
  orderNo: 0,
  badgeType: undefined as string | undefined,
  badgeContent: '',
  iframeSrc: '',
  link: '',
  affixTab: false,
  hideInMenu: false,
  hideChildrenInMenu: false,
  hideInBreadcrumb: false,
  hideInTab: false,
});

// ==================== Table Columns ====================
const columns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    width: 200,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 80,
    align: 'center' as const,
  },
  {
    title: '权限标识',
    dataIndex: 'permission',
    key: 'permission',
    width: 180,
  },
  {
    title: '路由地址',
    dataIndex: 'path',
    key: 'path',
    width: 180,
  },
  {
    title: '页面组件',
    dataIndex: 'component',
    key: 'component',
    width: 220,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    align: 'center' as const,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];

// ==================== Computed ====================
const parentTreeData = computed(() => {
  const topNode = {
    key: 0,
    value: 0,
    title: '顶级菜单',
    children: [] as any[],
  };
  topNode.children = buildTreeForSelect(dataSource.value);
  return [topNode];
});

function buildTreeForSelect(list: any[]): any[] {
  return list.map((item: any) => ({
    key: item.id,
    value: item.id,
    title: item.title || item.name,
    children: item.children ? buildTreeForSelect(item.children) : [],
  }));
}

// Show/hide form fields based on type
const showPath = computed(() => [0, 1, 3, 4].includes(formState.type));
const showComponent = computed(() => formState.type === 1);
const showIcon = computed(() => [0, 1, 3, 4].includes(formState.type));
const showPermission = computed(() => [1, 2].includes(formState.type));
const showIframeSrc = computed(() => formState.type === 3);
const showLink = computed(() => formState.type === 4);
const showActivePath = computed(() => [1, 3].includes(formState.type));
const showRedirect = computed(() => formState.type === 0);
const showExtraSettings = computed(() => [0, 1, 3, 4].includes(formState.type));

// ==================== Data Loading ====================
const fetchData = async () => {
  loading.value = true;
  try {
    const list = await getMenuList();
    flatList.value = list;
    dataSource.value = buildTree(list);
    expandedRowKeys.value = list
      .filter((item: any) => {
        return list.some((child: any) => child.parentId === item.id);
      })
      .map((item: any) => item.id);
  } catch (error) {
    console.error(error);
    message.error('加载菜单数据失败');
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

// ==================== Drawer Operations ====================
function resetForm() {
  Object.assign(formState, {
    id: undefined,
    parentId: 0,
    name: '',
    title: '',
    path: '',
    component: '',
    icon: '',
    activeIcon: '',
    activePath: '',
    permission: '',
    redirect: '',
    type: 0,
    status: 1,
    orderNo: 0,
    badgeType: undefined,
    badgeContent: '',
    iframeSrc: '',
    link: '',
    affixTab: false,
    hideInMenu: false,
    hideChildrenInMenu: false,
    hideInBreadcrumb: false,
    hideInTab: false,
  });
}

function openAddDrawer(parentId?: number) {
  drawerTitle.value = '新增菜单';
  resetForm();
  if (parentId !== undefined) {
    formState.parentId = parentId;
  }
  drawerVisible.value = true;
}

function openEditDrawer(record: any) {
  drawerTitle.value = '修改菜单';
  Object.assign(formState, {
    id: record.id,
    parentId: record.parentId ?? 0,
    name: record.name ?? '',
    title: record.title ?? '',
    path: record.path ?? '',
    component: record.component ?? '',
    icon: record.icon ?? '',
    activeIcon: record.activeIcon ?? '',
    activePath: record.activePath ?? '',
    permission: record.permission ?? '',
    redirect: record.redirect ?? '',
    type: record.type ?? 0,
    status: record.status ?? 1,
    orderNo: record.orderNo ?? 0,
    badgeType: record.badgeType || undefined,
    badgeContent: record.badgeContent ?? '',
    iframeSrc: record.iframeSrc ?? '',
    link: record.link ?? '',
    affixTab: record.affixTab ?? false,
    hideInMenu: record.hideInMenu ?? false,
    hideChildrenInMenu: record.hideChildrenInMenu ?? false,
    hideInBreadcrumb: record.hideInBreadcrumb ?? false,
    hideInTab: record.hideInTab ?? false,
  });
  drawerVisible.value = true;
}

async function handleSubmit() {
  if (!formState.title.trim()) {
    message.warning('请输入菜单名称');
    return;
  }

  try {
    const data = { ...formState, parentId: formState.parentId ?? 0 };

    if (formState.id) {
      await updateMenu(data);
      message.success('更新成功');
    } else {
      const { id, ...rest } = data;
      await addMenu(rest);
      message.success('新增成功');
    }
    drawerVisible.value = false;
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('操作失败');
  }
}

async function handleDelete(id: number) {
  try {
    await deleteMenu(id);
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
  <Page title="菜单管理" content-class="p-4">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <div />
      <Button type="primary" @click="openAddDrawer()">
        <template #icon>
          <span class="mr-1">+</span>
        </template>
        新增菜单
      </Button>
    </div>

    <!-- Tree Table -->
    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :expanded-row-keys="expandedRowKeys"
      :pagination="false"
      :scroll="{ x: 1100 }"
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
        <!-- Title with icon -->
        <template v-if="column.key === 'title'">
          <span>{{ record.icon ? `${record.icon} ` : '' }}</span>
          <span>{{ record.title }}</span>
        </template>

        <!-- Type Column -->
        <template v-if="column.key === 'type'">
          <Tag :color="MENU_TYPE_MAP[record.type]?.color || 'default'">
            {{ MENU_TYPE_MAP[record.type]?.label || '未知' }}
          </Tag>
        </template>

        <!-- Status Column -->
        <template v-if="column.key === 'status'">
          <Tag :color="record.status === 1 ? 'success' : 'error'">
            {{ record.status === 1 ? '已启用' : '已禁用' }}
          </Tag>
        </template>

        <!-- Action Column -->
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="openAddDrawer(record.id)"
            >
              新增下级
            </Button>
            <Button type="link" size="small" @click="openEditDrawer(record)">
              修改
            </Button>
            <Popconfirm
              title="确定要删除该菜单吗？"
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

    <!-- Add/Edit Drawer -->
    <Drawer
      v-model:open="drawerVisible"
      :title="drawerTitle"
      :width="620"
      destroy-on-close
    >
      <Form
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 17 }"
        layout="horizontal"
      >
        <!-- Type Selector -->
        <FormItem label="类型">
          <RadioGroup v-model:value="formState.type" button-style="solid">
            <RadioButton :value="0">目录</RadioButton>
            <RadioButton :value="1">菜单</RadioButton>
            <RadioButton :value="2">按钮</RadioButton>
            <RadioButton :value="3">内嵌</RadioButton>
            <RadioButton :value="4">外链</RadioButton>
          </RadioGroup>
        </FormItem>

        <!-- Row 1: Name + Parent -->
        <div class="grid grid-cols-2 gap-x-4">
          <FormItem label="菜单名称" required :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.title"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
          <FormItem label="上级菜单" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <TreeSelect
              v-model:value="formState.parentId"
              :tree-data="parentTreeData"
              placeholder="请选择"
              tree-default-expand-all
              allow-clear
            />
          </FormItem>
        </div>

        <!-- Row 2: Title + Route Path (for dir/menu/iframe/link) -->
        <div v-if="showPath" class="grid grid-cols-2 gap-x-4">
          <FormItem label="标题" required :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.name"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
          <FormItem label="路由地址" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.path"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
        </div>

        <!-- Button type: title row -->
        <div v-if="formState.type === 2" class="grid grid-cols-2 gap-x-4">
          <FormItem label="标题" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.name"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
          <FormItem label="权限标识" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.permission"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
        </div>

        <!-- Row 3: Icon + Component/ActiveIcon -->
        <div v-if="showIcon" class="grid grid-cols-2 gap-x-4">
          <FormItem label="图标" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.icon"
              placeholder="请选择"
              allow-clear
            />
          </FormItem>
          <FormItem v-if="showComponent" label="页面组件" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.component"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
          <FormItem v-else label="激活图标" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.activeIcon"
              placeholder="请选择"
              allow-clear
            />
          </FormItem>
        </div>

        <!-- Row: Active path + Component for menu -->
        <div v-if="showActivePath" class="grid grid-cols-2 gap-x-4">
          <FormItem label="激活路径" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.activePath"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
          <div />
        </div>

        <!-- Iframe src -->
        <div v-if="showIframeSrc" class="grid grid-cols-2 gap-x-4">
          <FormItem label="Iframe地址" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.iframeSrc"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
          <div />
        </div>

        <!-- External link -->
        <div v-if="showLink" class="grid grid-cols-2 gap-x-4">
          <FormItem label="链接地址" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.link"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
          <div />
        </div>

        <!-- Row: Permission + Status -->
        <div v-if="formState.type !== 2" class="grid grid-cols-2 gap-x-4">
          <FormItem v-if="showPermission" label="权限标识" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.permission"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
          <FormItem v-else label="排序" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <InputNumber v-model:value="formState.orderNo" :min="0" class="w-full" />
          </FormItem>
          <FormItem label="状态" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <RadioGroup v-model:value="formState.status" button-style="solid">
              <RadioButton :value="1">已启用</RadioButton>
              <RadioButton :value="0">已禁用</RadioButton>
            </RadioGroup>
          </FormItem>
        </div>

        <!-- Button type: Status -->
        <div v-if="formState.type === 2" class="grid grid-cols-2 gap-x-4">
          <FormItem label="状态" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <RadioGroup v-model:value="formState.status" button-style="solid">
              <RadioButton :value="1">已启用</RadioButton>
              <RadioButton :value="0">已禁用</RadioButton>
            </RadioGroup>
          </FormItem>
          <div />
        </div>

        <!-- Badge row -->
        <div v-if="showExtraSettings" class="grid grid-cols-2 gap-x-4">
          <FormItem label="徽标类型" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Select
              v-model:value="formState.badgeType"
              placeholder="请选择"
              allow-clear
            >
              <SelectOption value="dot">圆点</SelectOption>
              <SelectOption value="normal">文本</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="徽标内容" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.badgeContent"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
        </div>

        <!-- Redirect (for directory type) -->
        <div v-if="showRedirect" class="grid grid-cols-2 gap-x-4">
          <FormItem label="重定向" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <Input
              v-model:value="formState.redirect"
              placeholder="请输入"
              allow-clear
            />
          </FormItem>
          <div />
        </div>

        <!-- Extra settings section -->
        <template v-if="showExtraSettings">
          <Divider>其它设置</Divider>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2">
            <Checkbox v-if="formState.type === 1" v-model:checked="formState.affixTab">
              固定在标签
            </Checkbox>
            <Checkbox v-model:checked="formState.hideInMenu">隐藏菜单</Checkbox>
            <Checkbox v-model:checked="formState.hideChildrenInMenu">
              隐藏子菜单
            </Checkbox>
            <Checkbox v-model:checked="formState.hideInBreadcrumb">
              在面包屑中隐藏
            </Checkbox>
            <Checkbox v-model:checked="formState.hideInTab">
              在标签栏中隐藏
            </Checkbox>
          </div>
        </template>
      </Form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button @click="drawerVisible = false">取消</Button>
          <Button type="primary" @click="handleSubmit">确认</Button>
        </div>
      </template>
    </Drawer>
  </Page>
</template>
