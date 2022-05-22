import Debug "mo:base/Debug";
import List "mo:base/List";
import Http "./Http";

Debug.print("Module Test: Http");

do {
  Debug.print("  URL query parameters can be removed by removeQuery");

  let path = "/";
  let params = "canisterId=aaaaa&dummy=1111";
  let fullPath = path # "?" # params;
  assert(Http.removeQuery(fullPath) == path);
};

do {
  Debug.print("  URL query parameters can be removed by removeQuery: NOT root path case");

  let path = "/test/path";
  let params = "canisterId=aaaaa&dummy=1111";
  let fullPath = path # "?" # params;
  assert(Http.removeQuery(fullPath) == path);
};

do {
  Debug.print("  URL query parameters can be extracted by extractQuery");

  let path = "/";
  let params = "firstParam=aaaaa&secondParam=abcdef&thirdParam=1111";
  let fullPath = path # "?" # params;
  assert(Http.extractQuery(fullPath) == params);
};

do {
  Debug.print("  Key-val list of URL query parameters can be obtained by queryParameters");

  let path = "/";
  let params = "firstParam=aaaaa&secondParam=abcdef";
  let fullPath = path # "?" # params;

  let expectedArray = [{key = "firstParam"; value ="aaaaa"}, {key = "secondParam"; value = "abcdef"}];
  let expected = List.fromArray<Http.Query>(expectedArray);
  assert(Http.queryParameters(fullPath) == expected);
};
