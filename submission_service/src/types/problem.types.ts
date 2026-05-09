export interface ICachedProblem {
  id: string;
  title: string;
  testcases: ITestCase[];
}

export interface ITestCase {
  input: string;
  output: string;
  id: string;
}

export interface IProblemDetails {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  editorial?: string;
  testcases: ITestCase[];
}
