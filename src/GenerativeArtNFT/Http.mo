import Blob "mo:base/Blob";
import Option "mo:base/Option";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import List "mo:base/List";

module Types {
  
  public type HeaderField = (Text, Text);

  public type HttpRequest = {
    body: Blob;
    headers: [HeaderField];
    method: Text;
    url: Text;
  };

  public type HttpResponse = {
    body: Blob;
    headers: [HeaderField];
    status_code: Nat16;
  };

  public type Query = {
    key: Text;
    value: Text;
  };

  // Remove query (e.g. url parameters)
  public func removeQuery(str: Text): Text {
    switch (Text.split(str, #char '?').next()) {
      case null { "/" };
      case (?t) { t };
    }
  };

  // Extract query (or remove path)
  public func extractQuery(str: Text): Text {
    let s = Text.split(str, #char '?');
    // Remove path
    let path = s.next();
    switch (s.next()) {
      case null { "" };
      case (?q) { q }; 
    }
  };

  // Return a list of query (key-value pair)
  public func queryParameters(str: Text): List.List<Query> {
    let queryText = extractQuery(str);

    let pairs = Iter.filter<Text>(Text.split(queryText, #char '&'), func (t) {
      Text.contains(t, #char '=')
    });

    Iter.toList(Iter.map<Text, Query>(pairs, func (t: Text) {
      let s = Text.split(t, #char '=');
      let key = switch (s.next()) {
        case null { "" };
        case (?k) { k };
      };
      let value = switch (s.next()) {
        case null { "" };
        case (?v) { v };
      };
      { key = key; value = value }
    }))
  };
}