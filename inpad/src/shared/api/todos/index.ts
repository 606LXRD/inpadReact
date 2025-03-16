import {QueryParams, Todo} from "./model.ts";
import {httpClient} from "../http-client";

const SLUG = 'todos';
export const getTodo = (params: QueryParams) =>
    httpClient.get('todos',{searchParams:params}).json<Todo[]>();

export const getTodoById = (id: string)=>
    httpClient.get(`${SLUG}/${id}`).json<Todo>();

export const updateTodo = (todo:Todo)=>
    httpClient.put(`${SLUG}/${todo.id}`,{json: todo}).json<Todo[]>();