import Debug "mo:base/Debug";
import List "mo:base/List";
import Http "../Http";

Debug.print("Module Test: Http");

do {
  Debug.print("  URL query parameters can be removed by removeQuery");

  let baseUrl = "https://aaaaaaaaaaaa.ic0.app";
  let params = "canisterId=aaaaa&dummy=1111";
  let fullUrl = baseUrl # "?" # params;
  assert(Http.removeQuery(fullUrl) == baseUrl);
};

do {
  Debug.print("  URL query parameters can be extracted by extractQuery");

  let baseUrl = "https://aaaaaaaaaaaa.ic0.app";
  let params = "firstParam=aaaaa&secondParam=abcdef&thirdParam=1111";
  let fullUrl = baseUrl # "?" # params;
  assert(Http.extractQuery(fullUrl) == params);
};

do {
  Debug.print("  Key-val list of URL query parameters can be obtained by queryParameters");

  let baseUrl = "https://aaaaaaaaaaaa.ic0.app";
  let params = "firstParam=aaaaa&secondParam=abcdef";
  let fullUrl = baseUrl # "?" # params;

  let expectedArray = [{key = "firstParam"; value ="aaaaa"}, {key = "secondParam"; value = "abcdef"}];
  let expected = List.fromArray<Http.Query>(expectedArray);
  assert(Http.queryParameters(fullUrl) == expected);
};
