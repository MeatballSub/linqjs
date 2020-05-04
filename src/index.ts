import { from } from "./Queryable";

type Name = { id: number; name: string };

const firstNames: Name[] = [{ id: 1, name: "Jeremy" }, { id: 2, name: "Nick" }];
const name_result = from(firstNames);
/*
console.log(firstNames);
console.log(name_result);

const numbers: number[] = [1, 2];
const number_result = from(numbers);

console.log(numbers);
console.log(number_result);
console.log(number_result.sum());

const str: string = "Hello";
const string_result = from(str);
console.log(str);
console.log(string_result);
*/

const ids = name_result.map(x => x.id);
console.log(ids);
console.log(ids.sum());
