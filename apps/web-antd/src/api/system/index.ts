import { requestClient } from '#/api/request';

// Dept
export const getDeptList = () => requestClient.get('/system/dept/list');
export const addDept = (data: any) => requestClient.post('/system/dept', data);
export const updateDept = (data: any) =>
  requestClient.put('/system/dept', data);
export const deleteDept = (id: number) =>
  requestClient.delete(`/system/dept/${id}`);

// Role
export const getRoleList = () => requestClient.get('/system/role/list');
export const addRole = (data: any) => requestClient.post('/system/role', data);
export const updateRole = (data: any) =>
  requestClient.put('/system/role', data);
export const deleteRole = (id: number) =>
  requestClient.delete(`/system/role/${id}`);

// Menu
export const getMenuList = () => requestClient.get('/system/menu/list');
export const addMenu = (data: any) => requestClient.post('/system/menu', data);
export const updateMenu = (data: any) =>
  requestClient.put('/system/menu', data);
export const deleteMenu = (id: number) =>
  requestClient.delete(`/system/menu/${id}`);

// User
export const getUserList = (params: any) =>
  requestClient.get('/system/user/list', { params });
export const addUser = (data: any) => requestClient.post('/system/user', data);
export const updateUser = (data: any) =>
  requestClient.put('/system/user', data);
export const deleteUser = (id: number) =>
  requestClient.delete(`/system/user/${id}`);
