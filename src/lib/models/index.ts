// Importing every model here (for its registration side effect) guarantees
// all schemas are registered whenever connectToDatabase() is called, no
// matter which specific models a given route's own code references. Without
// this, a route that only imports e.g. TaskProgress but populates its
// `intern`/`assignment`/`task`/`batch` refs works fine locally (one shared
// process keeps every model registered) but throws
// `MissingSchemaError: Schema hasn't been registered for model "X"` in a
// serverless deployment where each route can bundle as an isolated function.
import "./Batch";
import "./Intern";
import "./Task";
import "./TaskAssignment";
import "./TaskProgress";
import "./Attendance";
import "./Review";
