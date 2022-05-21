/*
GenerativeArtNFT
*/
import Cycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import AID "./util/AccountIdentifier";
import ExtCore "./ext/Core";
import ExtCommon "./ext/Common";
import ExtAllowance "./ext/Allowance";
import ExtNonFungible "./ext/NonFungible";
import Http "./Http";

shared (install) actor class GenerativeArtNFT() = this {
  
  // Types
  type AccountIdentifier = ExtCore.AccountIdentifier;
  type SubAccount = ExtCore.SubAccount;
  type User = ExtCore.User;
  type Balance = ExtCore.Balance;
  type TokenIdentifier = ExtCore.TokenIdentifier;
  type TokenIndex  = ExtCore.TokenIndex ;
  type Extension = ExtCore.Extension;
  type CommonError = ExtCore.CommonError;
  type BalanceRequest = ExtCore.BalanceRequest;
  type BalanceResponse = ExtCore.BalanceResponse;
  type TransferRequest = ExtCore.TransferRequest;
  type TransferResponse = ExtCore.TransferResponse;
  type AllowanceRequest = ExtAllowance.AllowanceRequest;
  type ApproveRequest = ExtAllowance.ApproveRequest;
  type Metadata = ExtCommon.Metadata;
  type MintRequest  = ExtNonFungible.MintRequest ;
  type HttpRequest = Http.HttpRequest;
  type HttpResponse = Http.HttpResponse;
  
  private let EXTENSIONS : [Extension] = ["@ext/common", "@ext/allowance", "@ext/nonfungible"];
  private let installer : Principal = install.caller;

  //State work
  private stable var _registryState : [(TokenIndex, AccountIdentifier)] = [];
  private var _registry : HashMap.HashMap<TokenIndex, AccountIdentifier> = HashMap.fromIter(_registryState.vals(), 0, ExtCore.TokenIndex.equal, ExtCore.TokenIndex.hash);
  
  private stable var _allowancesState : [(TokenIndex, Principal)] = [];
  private var _allowances : HashMap.HashMap<TokenIndex, Principal> = HashMap.fromIter(_allowancesState.vals(), 0, ExtCore.TokenIndex.equal, ExtCore.TokenIndex.hash);
  
  private stable var _tokenMetadataState : [(TokenIndex, Metadata)] = [];
  private var _tokenMetadata : HashMap.HashMap<TokenIndex, Metadata> = HashMap.fromIter(_tokenMetadataState.vals(), 0, ExtCore.TokenIndex.equal, ExtCore.TokenIndex.hash);
  
  private stable var _tokenImageState : [(TokenIndex, Blob)] = [];
  private var _tokenImage : HashMap.HashMap<TokenIndex, Blob> = HashMap.fromIter(_tokenImageState.vals(), 0, ExtCore.TokenIndex.equal, ExtCore.TokenIndex.hash);
  
  private stable var _supply : Balance  = 0;
  private stable var _nextTokenId : TokenIndex  = 0;


  //State functions
  system func preupgrade() {
    _registryState := Iter.toArray(_registry.entries());
    _allowancesState := Iter.toArray(_allowances.entries());
    _tokenMetadataState := Iter.toArray(_tokenMetadata.entries());
    _tokenImageState := Iter.toArray(_tokenImage.entries());
  };
  system func postupgrade() {
    _registryState := [];
    _allowancesState := [];
    _tokenMetadataState := [];
    _tokenImageState := [];
  };
  
  public shared(msg) func mintNFT(request : MintRequest) : async TokenIndex {
    assert(not Principal.isAnonymous(msg.caller));
    let receiver = ExtCore.User.toAID(request.to);
    let token = _nextTokenId;
    let md : Metadata = #nonfungible({
      metadata = request.metadata;
    }); 
    _registry.put(token, receiver);
    _tokenMetadata.put(token, md);
    _supply := _supply + 1;
    _nextTokenId := _nextTokenId + 1;
    token;
  };
  
  public shared(msg) func transfer(request: TransferRequest) : async TransferResponse {
    if (request.amount != 1) {
      return #err(#Other("Must use amount of 1"));
    };
    if (ExtCore.TokenIdentifier.isPrincipal(request.token, Principal.fromActor(this)) == false) {
      return #err(#InvalidToken(request.token));
    };
    let token = ExtCore.TokenIdentifier.getIndex(request.token);
    let owner = ExtCore.User.toAID(request.from);
    let spender = AID.fromPrincipal(msg.caller, request.subaccount);
    let receiver = ExtCore.User.toAID(request.to);
    
    switch (_registry.get(token)) {
      case (?token_owner) {
        if(AID.equal(owner, token_owner) == false) {
          return #err(#Unauthorized(owner));
        };
        if (AID.equal(owner, spender) == false) {
          switch (_allowances.get(token)) {
            case (?token_spender) {
              if(Principal.equal(msg.caller, token_spender) == false) {                
                return #err(#Unauthorized(spender));
              };
            };
            case (_) {
              return #err(#Unauthorized(spender));
            };
          };
        };
        _allowances.delete(token);
        _registry.put(token, receiver);
        return #ok(request.amount);
      };
      case (_) {
        return #err(#InvalidToken(request.token));
      };
    };
  };
  
  public shared(msg) func approve(request: ApproveRequest) : async () {
    if (ExtCore.TokenIdentifier.isPrincipal(request.token, Principal.fromActor(this)) == false) {
      return;
    };
    let token = ExtCore.TokenIdentifier.getIndex(request.token);
    let owner = AID.fromPrincipal(msg.caller, request.subaccount);
    switch (_registry.get(token)) {
      case (?token_owner) {
        if(AID.equal(owner, token_owner) == false) {
          return;
        };
        _allowances.put(token, request.spender);
        return;
      };
      case (_) {
        return;
      };
    };
  };

  public query func extensions() : async [Extension] {
    EXTENSIONS;
  };
  
  public query func balance(request : BalanceRequest) : async BalanceResponse {
    if (ExtCore.TokenIdentifier.isPrincipal(request.token, Principal.fromActor(this)) == false) {
      return #err(#InvalidToken(request.token));
    };
    let token = ExtCore.TokenIdentifier.getIndex(request.token);
    let aid = ExtCore.User.toAID(request.user);
    switch (_registry.get(token)) {
      case (?token_owner) {
        if (AID.equal(aid, token_owner) == true) {
          return #ok(1);
        } else {          
          return #ok(0);
        };
      };
      case (_) {
        return #err(#InvalidToken(request.token));
      };
    };
  };
  
  public query func allowance(request : AllowanceRequest) : async Result.Result<Balance, CommonError> {
    if (ExtCore.TokenIdentifier.isPrincipal(request.token, Principal.fromActor(this)) == false) {
      return #err(#InvalidToken(request.token));
    };
    let token = ExtCore.TokenIdentifier.getIndex(request.token);
    let owner = ExtCore.User.toAID(request.owner);
    switch (_registry.get(token)) {
      case (?token_owner) {
        if (AID.equal(owner, token_owner) == false) {          
          return #err(#Other("Invalid owner"));
        };
        switch (_allowances.get(token)) {
          case (?token_spender) {
            if (Principal.equal(request.spender, token_spender) == true) {
              return #ok(1);
            } else {          
              return #ok(0);
            };
          };
          case (_) {
            return #ok(0);
          };
        };
      };
      case (_) {
        return #err(#InvalidToken(request.token));
      };
    };
  };
  
  public query func bearer(token : TokenIdentifier) : async Result.Result<AccountIdentifier, CommonError> {
    if (ExtCore.TokenIdentifier.isPrincipal(token, Principal.fromActor(this)) == false) {
      return #err(#InvalidToken(token));
    };
    let tokenind = ExtCore.TokenIdentifier.getIndex(token);
    switch (_registry.get(tokenind)) {
      case (?token_owner) {
        return #ok(token_owner);
      };
      case (_) {
        return #err(#InvalidToken(token));
      };
    };
  };
  
  public query func supply(token : TokenIdentifier) : async Result.Result<Balance, CommonError> {
    #ok(_supply);
  };
  
  public query func getRegistry() : async [(TokenIndex, AccountIdentifier)] {
    Iter.toArray(_registry.entries());
  };
  public query func getAllowances() : async [(TokenIndex, Principal)] {
    Iter.toArray(_allowances.entries());
  };
  public query func getTokens() : async [(TokenIndex, Metadata)] {
    Iter.toArray(_tokenMetadata.entries());
  };
  public query func getTokenImages() : async [(TokenIndex, Blob)] {
    Iter.toArray(_tokenImage.entries());
  };
  
  public query func metadata(token : TokenIdentifier) : async Result.Result<Metadata, CommonError> {
    if (ExtCore.TokenIdentifier.isPrincipal(token, Principal.fromActor(this)) == false) {
      return #err(#InvalidToken(token));
    };
    let tokenind = ExtCore.TokenIdentifier.getIndex(token);
    switch (_tokenMetadata.get(tokenind)) {
      case (?token_metadata) {
        return #ok(token_metadata);
      };
      case (_) {
        return #err(#InvalidToken(token));
      };
    };
  };
  
  public shared({caller}) func setTokenImage(tokenIndex : TokenIndex, imageBase64 : Text) : async Result.Result<(), CommonError> {
    if (caller != installer) {
      return #err(#Other("Authentication error"))
    };
    _tokenImage.put(tokenIndex, Text.encodeUtf8(imageBase64));
    #ok
  };

  public query func http_request(req: HttpRequest): async HttpResponse {
    let path = Http.removeQuery(req.url);
    if (path == "/") {
      let queryParameters = Http.queryParameters(req.url);
      return switch (List.find<Http.Query>(queryParameters, func (q) { q.key == "tokenid" })) {
        case null {
          {
            body = Text.encodeUtf8("Generative Art NFT");
            headers = [];
            status_code = 200;
            streaming_strategy = null;
          }
        };
        case (?q) {
          let tokenIdentifierText = q.value;
          if (ExtCore.TokenIdentifier.isPrincipal(tokenIdentifierText, Principal.fromActor(this)) == false) {
            return {
              body = Text.encodeUtf8("Invalid token " # tokenIdentifierText);
              headers = [];
              status_code = 404;
              streaming_strategy = null;
            };
          };

          let tokenIndex = ExtCore.TokenIdentifier.getIndex(tokenIdentifierText);
          let tokenImage = _image(tokenIndex);

          return {
            body = tokenImage;
            headers = [("content-type", "image/png")];
            status_code = 200;
            streaming_strategy = null;
          };
        };
      };
    };
    return {
      body = Text.encodeUtf8("404 Not found :" # path);
      headers = [];
      status_code = 404;
      streaming_strategy = null;
    };
  };

  func _image(tokenIndex: TokenIndex) : Blob {
    let fallbackPixelText = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    switch (_tokenImage.get(tokenIndex)) {
      case (?tokenImage) {
        tokenImage
      };
      case (_) {
        Text.encodeUtf8(fallbackPixelText)
      };
    }
  };

  //Internal cycle management - good general case
  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept(available);
    assert (accepted == available);
  };
  public query func availableCycles() : async Nat {
    return Cycles.balance();
  };
}