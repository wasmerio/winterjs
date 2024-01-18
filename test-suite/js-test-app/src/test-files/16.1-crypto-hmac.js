import { assert_false, assert_true, assert_unreached, promise_test } from "../test-utils";

function getTestVectors() {
  var plaintext = new Uint8Array([95, 77, 186, 79, 50, 12, 12, 232, 118, 114, 90, 252, 229, 251, 210, 91, 248, 62, 90, 113, 37, 160, 140, 175, 231, 60, 62, 186, 196, 33, 119, 157, 249, 213, 93, 24, 12, 58, 233, 148, 38, 69, 225, 216, 47, 238, 140, 157, 41, 75, 60, 177, 160, 138, 153, 49, 32, 27, 60, 14, 129, 252, 71, 202, 207, 131, 21, 162, 175, 102, 50, 65, 19, 195, 182, 98, 48, 195, 70, 8, 196, 244, 89, 54, 52, 206, 2, 178, 103, 54, 34, 119, 240, 168, 64, 202, 116, 188, 61, 26, 98, 54, 149, 44, 94, 215, 170, 248, 168, 254, 203, 221, 250, 117, 132, 230, 151, 140, 234, 93, 42, 91, 159, 183, 241, 180, 140, 139, 11, 229, 138, 48, 82, 2, 117, 77, 131, 118, 16, 115, 116, 121, 60, 240, 38, 170, 238, 83, 0, 114, 125, 131, 108, 215, 30, 113, 179, 69, 221, 178, 228, 68, 70, 255, 197, 185, 1, 99, 84, 19, 137, 13, 145, 14, 163, 128, 152, 74, 144, 25, 16, 49, 50, 63, 22, 219, 204, 157, 107, 225, 104, 184, 72, 133, 56, 76, 160, 62, 18, 96, 10, 193, 194, 72, 2, 138, 243, 114, 108, 201, 52, 99, 136, 46, 168, 192, 42, 171]);

  var raw = {
    "SHA-1": new Uint8Array([71, 162, 7, 70, 209, 113, 121, 219, 101, 224, 167, 157, 237, 255, 199, 253, 241, 129, 8, 27]),
    "SHA-256": new Uint8Array([229, 136, 236, 8, 17, 70, 61, 118, 114, 65, 223, 16, 116, 180, 122, 228, 7, 27, 81, 242, 206, 54, 83, 123, 166, 156, 205, 195, 253, 194, 183, 168]),
    "SHA-384": new Uint8Array([107, 29, 162, 142, 171, 31, 88, 42, 217, 113, 142, 255, 224, 94, 35, 213, 253, 44, 152, 119, 162, 217, 68, 63, 144, 190, 192, 147, 190, 206, 46, 167, 210, 53, 76, 208, 189, 197, 225, 71, 210, 233, 0, 147, 115, 73, 68, 136]),
    "SHA-512": new Uint8Array([93, 204, 53, 148, 67, 170, 246, 82, 250, 19, 117, 214, 179, 230, 31, 220, 242, 155, 180, 162, 139, 213, 211, 220, 250, 64, 248, 47, 144, 107, 178, 128, 4, 85, 219, 3, 181, 211, 31, 185, 114, 161, 90, 109, 1, 3, 162, 78, 86, 209, 86, 161, 25, 192, 229, 161, 233, 42, 68, 195, 197, 101, 124, 249])
  };

  var signatures = {
    "SHA-1": new Uint8Array([5, 51, 144, 42, 153, 248, 82, 78, 229, 10, 240, 29, 56, 222, 220, 225, 51, 217, 140, 160]),
    "SHA-256": new Uint8Array([133, 164, 12, 234, 46, 7, 140, 40, 39, 163, 149, 63, 251, 102, 194, 123, 41, 26, 71, 43, 13, 112, 160, 0, 11, 69, 216, 35, 128, 62, 235, 84]),
    "SHA-384": new Uint8Array([33, 124, 61, 80, 240, 186, 154, 109, 110, 174, 30, 253, 215, 165, 24, 254, 46, 56, 128, 181, 130, 164, 13, 6, 30, 144, 153, 193, 224, 38, 239, 88, 130, 84, 139, 93, 92, 236, 221, 85, 152, 217, 155, 107, 111, 48, 87, 255]),
    "SHA-512": new Uint8Array([97, 251, 39, 140, 63, 251, 12, 206, 43, 241, 207, 114, 61, 223, 216, 239, 31, 147, 28, 12, 97, 140, 37, 144, 115, 36, 96, 89, 57, 227, 249, 162, 198, 244, 175, 105, 11, 218, 52, 7, 220, 47, 87, 112, 246, 160, 164, 75, 149, 77, 100, 163, 50, 227, 238, 8, 33, 171, 248, 43, 127, 62, 153, 193])
  };

  // Each test vector has the following fields:
  //     name - a unique name for this vector
  //     keyBuffer - an arrayBuffer with the key data
  //     key - a CryptoKey object for the keyBuffer. INITIALLY null! You must fill this in first to use it!
  //     hashName - the hash function to sign with
  //     plaintext - the text to encrypt
  //     signature - the expected signature
  var vectors = [];
  Object.keys(raw).forEach(function (hashName) {
    vectors.push({
      name: "HMAC with " + hashName,
      hash: hashName,
      keyBuffer: raw[hashName],
      key: null,
      plaintext: plaintext,
      signature: signatures[hashName]
    });
  });

  return vectors;
}

async function handleRequest(request) {
  try {
    var subtle = crypto.subtle; // Change to test prefixed implementations

    // When are all these tests really done? When all the promises they use have resolved.
    var all_promises = [];

    // Source file hmac_vectors.js provides the getTestVectors method
    // for the algorithm that drives these tests.
    var testVectors = getTestVectors();

    // Test verification first, because signing tests rely on that working
    testVectors.forEach(function (vector) {
      var promise = importVectorKeys(vector, ["verify", "sign"])
        .then(function (vector) {
          return promise_test(function (test) {
            var operation = subtle.verify({ name: "HMAC", hash: vector.hash }, vector.key, vector.signature, vector.plaintext)
              .then(function (is_verified) {
                assert_true(is_verified, "Signature verified");
              }, function (err) {
                assert_unreached("Verification should not throw error " + vector.name + ": " + err.message + "'");
              });

            return operation;
          }, vector.name + " verification");

        }, function (err) {
          // We need a failed test if the importVectorKey operation fails, so
          // we know we never tested verification.
          return promise_test(function (test) {
            assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
          }, "importVectorKeys step: " + vector.name + " verification");
        });

      all_promises.push(promise);
    });

    // Test verification with an altered buffer after call
    testVectors.forEach(function (vector) {
      var promise = importVectorKeys(vector, ["verify", "sign"])
        .then(function (vector) {
          return promise_test(function (test) {
            var signature = copyBuffer(vector.signature);
            var operation = subtle.verify({ name: "HMAC", hash: vector.hash }, vector.key, signature, vector.plaintext)
              .then(function (is_verified) {
                assert_true(is_verified, "Signature is not verified");
              }, function (err) {
                assert_unreached("Verification should not throw error " + vector.name + ": " + err.message + "'");
              });

            signature[0] = 255 - signature[0];
            return operation;
          }, vector.name + " verification with altered signature after call");
        }, function (err) {
          promise_test(function (test) {
            assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
          }, "importVectorKeys step: " + vector.name + " verification with altered signature after call");
        });

      all_promises.push(promise);
    });

    // Check for successful verification even if plaintext is altered after call.
    testVectors.forEach(function (vector) {
      var promise = importVectorKeys(vector, ["verify", "sign"])
        .then(function (vector) {
          return promise_test(function (test) {
            var plaintext = copyBuffer(vector.plaintext);
            var operation = subtle.verify({ name: "HMAC", hash: vector.hash }, vector.key, vector.signature, plaintext)
              .then(function (is_verified) {
                assert_true(is_verified, "Signature verified");
              }, function (err) {
                assert_unreached("Verification should not throw error " + vector.name + ": " + err.message + "'");
              });

            plaintext[0] = 255 - plaintext[0];
            return operation;
          }, vector.name + " with altered plaintext after call");
        }, function (err) {
          return promise_test(function (test) {
            assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
          }, "importVectorKeys step: " + vector.name + " with altered plaintext");
        });

      all_promises.push(promise);
    });

    // Check for failures due to no "verify" usage.
    testVectors.forEach(function (originalVector) {
      var vector = Object.assign({}, originalVector);

      var promise = importVectorKeys(vector, ["sign"])
        .then(function (vector) {
          return promise_test(function (test) {
            return subtle.verify({ name: "HMAC", hash: vector.hash }, vector.key, vector.signature, vector.plaintext)
              .then(function (plaintext) {
                assert_unreached("Should have thrown error for no verify usage in " + vector.name + ": " + err.message + "'");
              }, function (err) {
                // TODO: we don't return the correct errors yet
                // assert_equals(err.name, "InvalidAccessError", "Should throw InvalidAccessError instead of '" + err.message + "'");
              });
          }, vector.name + " no verify usage");
        }, function (err) {
          return promise_test(function (test) {
            assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
          }, "importVectorKeys step: " + vector.name + " no verify usage");
        });

      all_promises.push(promise);
    });

    // Check for successful signing and verification.
    testVectors.forEach(function (vector) {
      var promise = importVectorKeys(vector, ["verify", "sign"])
        .then(function (vectors) {
          return promise_test(function (test) {
            return subtle.sign({ name: "HMAC", hash: vector.hash }, vector.key, vector.plaintext)
              .then(function (signature) {
                assert_true(equalBuffers(signature, vector.signature), "Signing did not give the expected output");
                // Can we get the verify the new signature?
                return subtle.verify({ name: "HMAC", hash: vector.hash }, vector.key, signature, vector.plaintext)
                  .then(function (is_verified) {
                    assert_true(is_verified, "Round trip verifies");
                    return signature;
                  }, function (err) {
                    assert_unreached("verify error for test " + vector.name + ": " + err.message + "'");
                  });
              });
          }, vector.name + " round trip");

        }, function (err) {
          // We need a failed test if the importVectorKey operation fails, so
          // we know we never tested signing or verifying
          return promise_test(function (test) {
            assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
          }, "importVectorKeys step: " + vector.name + " round trip");
        });

      all_promises.push(promise);
    });

    // TODO: Commented out because we don't have ECDSA yet
    // // Test signing with the wrong algorithm
    // testVectors.forEach(function (vector) {
    //   // Want to get the key for the wrong algorithm
    //   var promise = subtle.generateKey({ name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" }, false, ["sign", "verify"])
    //     .then(function (wrongKey) {
    //       return importVectorKeys(vector, ["verify", "sign"])
    //         .then(function (vectors) {
    //           return promise_test(function (test) {
    //             var operation = subtle.sign({ name: "HMAC", hash: vector.hash }, wrongKey.privateKey, vector.plaintext)
    //               .then(function (signature) {
    //                 assert_unreached("Signing should not have succeeded for " + vector.name);
    //               }, function (err) {
    //                 assert_equals(err.name, "InvalidAccessError", "Should have thrown InvalidAccessError instead of '" + err.message + "'");
    //               });

    //             return operation;
    //           }, vector.name + " signing with wrong algorithm name");

    //         }, function (err) {
    //           // We need a failed test if the importVectorKey operation fails, so
    //           // we know we never tested verification.
    //           return promise_test(function (test) {
    //             assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
    //           }, "importVectorKeys step: " + vector.name + " signing with wrong algorithm name");
    //         });
    //     }, function (err) {
    //       return promise_test(function (test) {
    //         assert_unreached("Generate wrong key for test " + vector.name + " failed: '" + err.message + "'");
    //       }, "generate wrong key step: " + vector.name + " signing with wrong algorithm name");
    //     });

    //   all_promises.push(promise);
    // });

    // // Test verification with the wrong algorithm
    // testVectors.forEach(function (vector) {
    //   // Want to get the key for the wrong algorithm
    //   var promise = subtle.generateKey({ name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" }, false, ["sign", "verify"])
    //     .then(function (wrongKey) {
    //       return importVectorKeys(vector, ["verify", "sign"])
    //         .then(function (vector) {
    //           return promise_test(function (test) {
    //             var operation = subtle.verify({ name: "HMAC", hash: vector.hash }, wrongKey.publicKey, vector.signature, vector.plaintext)
    //               .then(function (signature) {
    //                 assert_unreached("Verifying should not have succeeded for " + vector.name);
    //               }, function (err) {
    //                 assert_equals(err.name, "InvalidAccessError", "Should have thrown InvalidAccessError instead of '" + err.message + "'");
    //               });

    //             return operation;
    //           }, vector.name + " verifying with wrong algorithm name");

    //         }, function (err) {
    //           // We need a failed test if the importVectorKey operation fails, so
    //           // we know we never tested verification.
    //           return promise_test(function (test) {
    //             assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
    //           }, "importVectorKeys step: " + vector.name + " verifying with wrong algorithm name");
    //         });
    //     }, function (err) {
    //       promise_test(function (test) {
    //         assert_unreached("Generate wrong key for test " + vector.name + " failed: '" + err.message + "'");
    //       }, "generate wrong key step: " + vector.name + " verifying with wrong algorithm name");
    //     });

    //   all_promises.push(promise);
    // });

    // Verification should fail if the plaintext is changed
    testVectors.forEach(function (vector) {
      var promise = importVectorKeys(vector, ["verify", "sign"])
        .then(function (vector) {
          var plaintext = copyBuffer(vector.plaintext);
          plaintext[0] = 255 - plaintext[0];
          return promise_test(function (test) {
            var operation = subtle.verify({ name: "HMAC", hash: vector.hash }, vector.key, vector.signature, plaintext)
              .then(function (is_verified) {
                assert_false(is_verified, "Signature is NOT verified");
              }, function (err) {
                assert_unreached("Verification should not throw error " + vector.name + ": " + err.message + "'");
              });

            return operation;
          }, vector.name + " verification failure due to wrong plaintext");

        }, function (err) {
          // We need a failed test if the importVectorKey operation fails, so
          // we know we never tested verification.
          return promise_test(function (test) {
            assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
          }, "importVectorKeys step: " + vector.name + " verification failure due to wrong plaintext");
        });

      all_promises.push(promise);
    });

    // Verification should fail if the signature is changed
    testVectors.forEach(function (vector) {
      var promise = importVectorKeys(vector, ["verify", "sign"])
        .then(function (vector) {
          var signature = copyBuffer(vector.signature);
          signature[0] = 255 - signature[0];
          return promise_test(function (test) {
            var operation = subtle.verify({ name: "HMAC", hash: vector.hash }, vector.key, signature, vector.plaintext)
              .then(function (is_verified) {
                assert_false(is_verified, "Signature is NOT verified");
              }, function (err) {
                assert_unreached("Verification should not throw error " + vector.name + ": " + err.message + "'");
              });

            return operation;
          }, vector.name + " verification failure due to wrong signature");

        }, function (err) {
          // We need a failed test if the importVectorKey operation fails, so
          // we know we never tested verification.
          return promise_test(function (test) {
            assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
          }, "importVectorKeys step: " + vector.name + " verification failure due to wrong signature");
        });

      all_promises.push(promise);
    });

    // Verification should fail if the signature is wrong length
    testVectors.forEach(function (vector) {
      var promise = importVectorKeys(vector, ["verify", "sign"])
        .then(function (vector) {
          var signature = vector.signature.slice(1); // Drop first byte
          return promise_test(function (test) {
            var operation = subtle.verify({ name: "HMAC", hash: vector.hash }, vector.key, signature, vector.plaintext)
              .then(function (is_verified) {
                assert_false(is_verified, "Signature is NOT verified");
              }, function (err) {
                assert_unreached("Verification should not throw error " + vector.name + ": " + err.message + "'");
              });

            return operation;
          }, vector.name + " verification failure due to short signature");

        }, function (err) {
          // We need a failed test if the importVectorKey operation fails, so
          // we know we never tested verification.
          return promise_test(function (test) {
            assert_unreached("importVectorKeys failed for " + vector.name + ". Message: ''" + err.message + "''");
          }, "importVectorKeys step: " + vector.name + " verification failure due to short signature");
        });

      all_promises.push(promise);
    });

    for (let promise of all_promises) {
      await promise;
    }

    // A test vector has all needed fields for signing and verifying, EXCEPT that the
    // key field may be null. This function replaces that null with the Correct
    // CryptoKey object.
    //
    // Returns a Promise that yields an updated vector on success.
    function importVectorKeys(vector, keyUsages) {
      if (vector.key !== null) {
        return new Promise(function (resolve, reject) {
          resolve(vector);
        });
      } else {
        return subtle.importKey("raw", vector.keyBuffer, { name: "HMAC", hash: vector.hash }, false, keyUsages)
          .then(function (key) {
            vector.key = key;
            return vector;
          });
      }
    }

    // Returns a copy of the sourceBuffer it is sent.
    function copyBuffer(sourceBuffer) {
      var source = new Uint8Array(sourceBuffer);
      var copy = new Uint8Array(sourceBuffer.byteLength)

      for (var i = 0; i < source.byteLength; i++) {
        copy[i] = source[i];
      }

      return copy;
    }

    function equalBuffers(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }

      var aBytes = new Uint8Array(a);
      var bBytes = new Uint8Array(b);

      for (var i = 0; i < a.byteLength; i++) {
        if (aBytes[i] !== bBytes[i]) {
          return false;
        }
      }

      return true;
    }

    return new Response('All Tests Passed!');
  }
  catch (e) {
    return new Response(e.toString(), { status: 500 });
  }
}

export { handleRequest };