import * as R from 'ramda'
import { expect } from 'chai'
import { GameEditor, Util, PGNParser, ChessTypes } from '../../src'

function manglePath(variation: ChessTypes.Variation) {
  return variation.map(m =>
    Util.truncateMoveFields({
      ...m,
      path: [
        [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)]
      ] as ChessTypes.PlyPath,
      variations: m.variations ? m.variations.map(v => manglePath(v)) : []
    })
  )
}

describe('Game editor', () => {
  describe('init state', () => {
    it('should start with default fen', () => {
      const e = new GameEditor.GameEditor()
      expect(e.getState()).to.eql({
        startFen: Util.DEFAULT_START_FEN,
        mainline: [],
        meta: {},
        result: '*',
        currentPath: null
      })
    })

    it('should start with given fen', () => {
      const e = new GameEditor.GameEditor('8/7r/4k3/8/8/K7/8/R7 w - - 0 1')
      expect(e.getState()).to.eql({
        startFen: '8/7r/4k3/8/8/K7/8/R7 w - - 0 1',
        mainline: [],
        meta: {},
        result: '*',
        currentPath: null
      })
    })
  })

  describe('setGame() - build paths', () => {
    describe('only mainline exists', () => {
      it('should return the moves with new paths', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const changedGame = R.clone(game)
        changedGame.mainline = manglePath(changedGame.mainline)
        const e = new GameEditor.GameEditor()
        e.setGame(changedGame)
        expect(e.getState().mainline).to.be.eql(game.mainline)
      })
    })

    describe('variations level 2', () => {
      it('should return the moves with new paths', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const changedGame = R.clone(game)
        changedGame.mainline = manglePath(changedGame.mainline)
        const e = new GameEditor.GameEditor()
        e.setGame(changedGame)
        expect(e.getState().mainline).to.be.eql(game.mainline)
      })
    })

    describe('variations level 3', () => {
      it('should return the moves with new paths', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 (3... g6) (3... d6) 4. Ba4 (4. Be2)) Bc5 *'
        )
        const changedGame = R.clone(game)
        changedGame.mainline = manglePath(changedGame.mainline)
        const e = new GameEditor.GameEditor()
        e.setGame(changedGame)
        expect(e.getState().mainline).to.be.eql(game.mainline)
      })
    })
  })

  describe('add normal move', () => {
    describe('when mainline is blank', () => {
      it('should append the move', () => {
        const e = new GameEditor.GameEditor()
        const move = e.addMove({ from: 'e2', to: 'e4' })
        expect(move).to.exist
        expect(e.getState().mainline).length(1)
        expect(e.getState().mainline).to.eql([
          {
            path: [[0, 0]],
            side: 'w',
            san: 'e4',
            from: 'e2',
            to: 'e4',
            fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
          }
        ])
      })
    })

    describe('when mainline is not blank', () => {
      it('should append the move', () => {
        const e = new GameEditor.GameEditor()
        e.addMove({ from: 'e2', to: 'e4' })
        const move = e.addMove({ from: 'e7', to: 'e5' })
        expect(move).to.exist
        expect(e.getState().mainline).length(2)
        expect(e.getState().mainline[1]).to.eql({
          path: [[0, 1]],
          side: 'b',
          san: 'e5',
          from: 'e7',
          to: 'e5',
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
        })
      })
    })

    describe('when mainline is not blank, insert in the end', () => {
      it('should append the move', () => {
        const e = new GameEditor.GameEditor()
        e.addMove({ from: 'e2', to: 'e4' })
        const move = e.addMove({ from: 'e7', to: 'e5' })
        expect(move).to.exist
        expect(e.getState().mainline).length(2)
        expect(e.getState().mainline[1]).to.eql({
          path: [[0, 1]],
          side: 'b',
          san: 'e5',
          from: 'e7',
          to: 'e5',
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
        })
      })
    })

    describe('when mainline is not blank, insert in the middle end', () => {
      it('should create a new variation and append the move', () => {
        const e = new GameEditor.GameEditor()
        e.addMove({ from: 'e2', to: 'e4' })
        e.addMove({ from: 'e7', to: 'e5' })
        e.addMove({ from: 'g1', to: 'f3' })
        e.gotoPath([[0, 1]]) // goto e7-e5
        const move = e.addMove({ from: 'd2', to: 'd4' })
        expect(move).to.exist
        expect(e.getState().mainline).length(3)
        expect(e.getState().mainline[2].variations).to.exist
        expect(e.getState().mainline[2].variations).length(1)
        expect(e.getState().mainline[2].variations).to.eql([
          [
            {
              path: [
                [0, 2],
                [0, 0]
              ],
              side: 'w',
              san: 'd4',
              from: 'd2',
              to: 'd4',
              fen:
                'rnbqkbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2'
            }
          ]
        ])
      })
    })

    describe('new move when a variation exists', () => {
      it('should create a new variation and append the move', () => {
        const e = new GameEditor.GameEditor()
        e.addMove({ from: 'e2', to: 'e4' })
        e.addMove({ from: 'e7', to: 'e5' })
        e.addMove({ from: 'g1', to: 'f3' })
        // create first variation
        e.gotoPath([[0, 1]]) // goto e7-e5
        e.addMove({ from: 'd2', to: 'd4' })
        e.gotoPath([[0, 1]]) // goto e7-e5
        const move = e.addMove({ from: 'c2', to: 'c3' })
        expect(move).to.exist
        expect(e.getState().mainline).length(3)
        expect(e.getState().mainline[2].variations).to.exist
        expect(e.getState().mainline[2].variations).length(2)
        expect(e.getState().mainline[2].variations).to.eql([
          [
            {
              path: [
                [0, 2],
                [0, 0]
              ],
              side: 'w',
              san: 'd4',
              from: 'd2',
              to: 'd4',
              fen:
                'rnbqkbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2'
            }
          ],
          [
            {
              path: [
                [0, 2],
                [1, 0]
              ],
              side: 'w',
              san: 'c3',
              from: 'c2',
              to: 'c3',
              fen:
                'rnbqkbnr/pppp1ppp/8/4p3/4P3/2P5/PP1P1PPP/RNBQKBNR b KQkq - 0 2'
            }
          ]
        ])
      })
    })

    describe('new move in a variation', () => {
      it('should create a new variation and append the move', () => {
        const e = new GameEditor.GameEditor()
        e.addMove({ from: 'e2', to: 'e4' })
        e.addMove({ from: 'e7', to: 'e5' })
        e.addMove({ from: 'g1', to: 'f3' })
        // create first variation
        e.gotoPath([[0, 1]]) // goto e7-e5
        e.addMove({ from: 'd2', to: 'd4' })
        e.gotoPath([[0, 1]]) // goto e7-e5
        e.addMove({ from: 'c2', to: 'c3' })
        const move = e.addMove({ from: 'd7', to: 'd5' })
        expect(move).to.exist
        expect(e.getState().mainline).length(3)
        expect(e.getState().mainline[2].variations).to.exist
        expect(e.getState().mainline[2].variations).length(2)
        expect(e.getState().mainline[2].variations).to.eql([
          [
            {
              path: [
                [0, 2],
                [0, 0]
              ],
              side: 'w',
              san: 'd4',
              from: 'd2',
              to: 'd4',
              fen:
                'rnbqkbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2'
            }
          ],
          [
            {
              path: [
                [0, 2],
                [1, 0]
              ],
              side: 'w',
              san: 'c3',
              from: 'c2',
              to: 'c3',
              fen:
                'rnbqkbnr/pppp1ppp/8/4p3/4P3/2P5/PP1P1PPP/RNBQKBNR b KQkq - 0 2'
            },
            {
              path: [
                [0, 2],
                [1, 1]
              ],
              side: 'b',
              san: 'd5',
              from: 'd7',
              to: 'd5',
              fen:
                'rnbqkbnr/ppp2ppp/8/3pp3/4P3/2P5/PP1P1PPP/RNBQKBNR w KQkq d6 0 3'
            }
          ]
        ])
      })
    })

    describe('new move in a variation - depth 2', () => {
      it('should create a new variation and append the move', () => {
        const e = new GameEditor.GameEditor()
        e.addMove({ from: 'e2', to: 'e4' })
        e.addMove({ from: 'e7', to: 'e5' })
        e.addMove({ from: 'g1', to: 'f3' })
        // create first variation
        e.gotoPath([[0, 1]]) // goto e7-e5
        e.addMove({ from: 'd2', to: 'd4' })
        e.gotoPath([[0, 1]]) // goto e7-e5
        e.addMove({ from: 'c2', to: 'c3' })
        e.addMove({ from: 'd7', to: 'd5' })
        e.addMove({ from: 'e4', to: 'd5' })
        e.gotoPath([
          [0, 2],
          [1, 1]
        ]) // goto variation e4-d5
        const move = e.addMove({ from: 'd2', to: 'd4' })
        expect(move).to.exist
        expect(e.getState().mainline).length(3)
        expect(e.getState().mainline[2].variations).to.exist
        expect(e.getState().mainline[2].variations).length(2)
        expect(e.getState().mainline[2].variations).to.eql([
          [
            {
              path: [
                [0, 2],
                [0, 0]
              ],
              side: 'w',
              san: 'd4',
              from: 'd2',
              to: 'd4',
              fen:
                'rnbqkbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2'
            }
          ],
          [
            {
              path: [
                [0, 2],
                [1, 0]
              ],
              side: 'w',
              san: 'c3',
              from: 'c2',
              to: 'c3',
              fen:
                'rnbqkbnr/pppp1ppp/8/4p3/4P3/2P5/PP1P1PPP/RNBQKBNR b KQkq - 0 2'
            },
            {
              path: [
                [0, 2],
                [1, 1]
              ],
              side: 'b',
              san: 'd5',
              from: 'd7',
              to: 'd5',
              fen:
                'rnbqkbnr/ppp2ppp/8/3pp3/4P3/2P5/PP1P1PPP/RNBQKBNR w KQkq d6 0 3'
            },
            {
              path: [
                [0, 2],
                [1, 2]
              ],
              side: 'w',
              san: 'exd5',
              from: 'e4',
              to: 'd5',
              fen:
                'rnbqkbnr/ppp2ppp/8/3Pp3/8/2P5/PP1P1PPP/RNBQKBNR b KQkq - 0 3',
              variations: [
                [
                  {
                    path: [
                      [0, 2],
                      [1, 2],
                      [0, 0]
                    ],
                    side: 'w',
                    san: 'd4',
                    from: 'd2',
                    to: 'd4',
                    fen:
                      'rnbqkbnr/ppp2ppp/8/3pp3/3PP3/2P5/PP3PPP/RNBQKBNR b KQkq d3 0 3'
                  }
                ]
              ]
            }
          ]
        ])
      })
    })
  })

  describe('add illegal move', () => {
    describe('normal illegal move', () => {
      it('should add to mainline', () => {
        const e = new GameEditor.GameEditor()
        e.addMove({ from: 'e2', to: 'e4' })
        e.addMove({ from: 'c7', to: 'c5' })
        e.addMove({ from: 'g1', to: 'f8' }, true)
        e.addMove({ from: 'h8', to: 'f8' }, true)

        expect(e.getState().mainline).to.eql([
          {
            path: [[0, 0]],
            side: 'w',
            san: 'e4',
            from: 'e2',
            to: 'e4',
            fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
          },
          {
            path: [[0, 1]],
            side: 'b',
            san: 'c5',
            from: 'c7',
            to: 'c5',
            fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2'
          },
          {
            type: 'ILLEGAL',
            path: [[0, 2]],
            side: 'w',
            san: 'g1-f8',
            from: 'g1',
            to: 'f8',
            fen: 'rnbqkNnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKB1R b KQkq c6 0 2'
          },
          {
            type: 'ILLEGAL',
            path: [[0, 3]],
            side: 'b',
            san: 'h8-f8',
            from: 'h8',
            to: 'f8',
            fen: 'rnbqkrn1/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKB1R w KQkq c6 0 3'
          }
        ])
      })

      it('should add to variation', () => {
        const e = new GameEditor.GameEditor()
        e.addMove({ from: 'e2', to: 'e4' })
        e.addMove({ from: 'e7', to: 'e5' })
        e.gotoPath([[0, 0]])
        e.addMove({ from: 'c7', to: 'c5' })
        e.addMove({ from: 'g1', to: 'f8' }, true)
        e.addMove({ from: 'h8', to: 'f8' }, true)

        expect(e.getState().mainline).to.eql([
          {
            path: [[0, 0]],
            side: 'w',
            san: 'e4',
            from: 'e2',
            to: 'e4',
            fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
          },
          {
            path: [[0, 1]],
            side: 'b',
            san: 'e5',
            from: 'e7',
            to: 'e5',
            fen:
              'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
            variations: [
              [
                {
                  path: [
                    [0, 1],
                    [0, 0]
                  ],
                  side: 'b',
                  san: 'c5',
                  from: 'c7',
                  to: 'c5',
                  fen:
                    'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2'
                },
                {
                  type: 'ILLEGAL',
                  path: [
                    [0, 1],
                    [0, 1]
                  ],
                  side: 'w',
                  san: 'g1-f8',
                  from: 'g1',
                  to: 'f8',
                  fen:
                    'rnbqkNnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKB1R b KQkq c6 0 2'
                },
                {
                  type: 'ILLEGAL',
                  path: [
                    [0, 1],
                    [0, 2]
                  ],
                  side: 'b',
                  san: 'h8-f8',
                  from: 'h8',
                  to: 'f8',
                  fen:
                    'rnbqkrn1/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKB1R w KQkq c6 0 3'
                }
              ]
            ]
          }
        ])
      })
    })
  })

  describe('delete variation', () => {
    describe('variation without deeper levels', () => {
      it('should remove the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.deleteVariationIntersecting([
          [0, 1],
          [0, 2]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })
    })

    describe('variation with deeper levels', () => {
      it('should remove the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.deleteVariationIntersecting([
          [0, 1],
          [0, 1],
          [0, 1]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })
    })

    describe('inner variation with deeper levels', () => {
      it('should remove the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.deleteVariationIntersecting([
          [0, 1],
          [0, 2]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })
    })

    describe('one among multiple variations', () => {
      it('should remove the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) (1... c5 2. Nf3 d6) (1... d6 2. d4 Nf6) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.deleteVariationIntersecting([
          [0, 1],
          [0, 2]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... c5 2. Nf3 d6) (1... d6 2. d4 Nf6) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })

      it('should remove the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) (1... c5 2. Nf3 d6) (1... d6 2. d4 Nf6) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.deleteVariationIntersecting([
          [0, 1],
          [1, 2]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) (1... d6 2. d4 Nf6) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })

      it('should remove the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) (1... c5 2. Nf3 d6) (1... d6 2. d4 Nf6) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.deleteVariationIntersecting([
          [0, 1],
          [2, 2]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) (1... c5 2. Nf3 d6) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })
    })
  })

  describe('promote variation', () => {
    describe('already a mainline', () => {
      it('should not do anything', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.promoteVariationIntersecting([[0, 3]])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })
    })

    describe('variation without deeper levels', () => {
      it('should promote the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.promoteVariationIntersecting([
          [0, 1],
          [0, 2]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e6 (1... e5 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5) 2. d4 d5 3. e5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })
    })

    describe('variation with deeper levels', () => {
      it('should promote the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.promoteVariationIntersecting([
          [0, 1],
          [0, 1],
          [0, 1]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. Nc3 (2. d4 d5 3. e5) Bb4 3. Nf3) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })
    })

    describe('inner variation with deeper levels', () => {
      it('should promote the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.promoteVariationIntersecting([
          [0, 1],
          [0, 2]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e6 (1... e5 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5) 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })
    })

    describe('one among multiple variations', () => {
      it('should promote the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) (1... c5 2. Nf3 d6) (1... d6 2. d4 Nf6) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.promoteVariationIntersecting([
          [0, 1],
          [0, 2]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e6 (1... e5 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5) (1... c5 2. Nf3 d6) (1... d6 2. d4 Nf6) 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })

      it('should promote the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) (1... c5 2. Nf3 d6) (1... d6 2. d4 Nf6) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.promoteVariationIntersecting([
          [0, 1],
          [1, 2]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 c5 (1... e5 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5) (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) (1... d6 2. d4 Nf6) 2. Nf3 d6 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })

      it('should promote the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) (1... c5 2. Nf3 d6) (1... d6 2. d4 Nf6) 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.promoteVariationIntersecting([
          [0, 1],
          [2, 2]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 d6 (1... e5 2. Nf3 Nc6 3. Bc4 (3. Bb5 a6 4. Ba4) Bc5) (1... e6 2. d4 (2. Nc3 Bb4 3. Nf3) d5 3. e5) (1... c5 2. Nf3 d6) 2. d4 Nf6 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })
    })

    describe('variation at first move', () => {
      it('should promote the variation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 (1. d4 Nf6 2. c4 g6) e5 2. Nf3 Nc6 3. Bb5 a6 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.promoteVariationIntersecting([
          [0, 0],
          [0, 1]
        ])
        const expectedMainline = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. d4 (1. e4 e5 2. Nf3 Nc6 3. Bb5 a6) Nf6 2. c4 g6 *'
        ).mainline
        expect(e.getState().mainline).to.be.eql(expectedMainline)
      })
    })
  })

  describe.skip('promote variation to mainline', () => {
    describe('variation without deeper levels', () => {
      it('should move the variation one level above', () => {})
    })

    describe('variation with deeper levels', () => {
      it('should move the variation one level above', () => {})
    })

    describe('inner variation with deeper levels', () => {
      it('should move the variation one level above', () => {})
    })

    describe('one among multiple variations', () => {
      it('should move the variation to mainline', () => {})

      it('should move the variation to mainline', () => {})

      it('should move the variation to mainline', () => {})
    })
  })

  describe('next', () => {
    describe('current path is null', () => {
      it('should go to first move', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.next()
        expect(e.getState().currentPath).to.eql([[0, 0]])
      })
    })

    describe('end of mainline', () => {
      it('should not go next', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.gotoPath([[0, 5]])
        e.next()
        expect(e.getState().currentPath).to.eql([[0, 5]])
      })
    })

    describe('end of variation', () => {
      it('should not go next', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... c5 2. Nf3 Nc6) 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.gotoPath([
          [0, 1],
          [0, 2]
        ])
        e.next()
        expect(e.getState().currentPath).to.eql([
          [0, 1],
          [0, 2]
        ])
      })
    })

    describe('in mainline', () => {
      it('should go next', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... c5 2. Nf3 Nc6) 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.gotoPath([[0, 2]])
        e.next()
        expect(e.getState().currentPath).to.eql([[0, 3]])
      })
    })

    describe('in variation', () => {
      it('should go next', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... c5 2. Nf3 Nc6) 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.gotoPath([
          [0, 1],
          [0, 1]
        ])
        e.next()
        expect(e.getState().currentPath).to.eql([
          [0, 1],
          [0, 2]
        ])
      })
    })
  })

  describe('prev', () => {
    describe('current path is null', () => {
      it('should not go back', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.prev()
        expect(e.getState().currentPath).to.be.null
      })
    })

    describe('beginning of mainline', () => {
      it('should set current path to null', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... c5 2. Nf3 Nc6) 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.gotoPath([[0, 0]])
        e.prev()
        expect(e.getState().currentPath).to.be.null
      })
    })

    describe('beginning of variation', () => {
      it('should should jump to parent', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... c5 2. Nf3 Nc6) 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.gotoPath([
          [0, 1],
          [0, 0]
        ])
        e.prev()
        expect(e.getState().currentPath).to.eql([[0, 1]])
      })
    })

    describe('in mainline', () => {
      it('should should go back', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... c5 2. Nf3 Nc6) 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.gotoPath([[0, 3]])
        e.prev()
        expect(e.getState().currentPath).to.eql([[0, 2]])
      })
    })

    describe('in variation', () => {
      it('should should go back', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 e5 (1... c5 2. Nf3 Nc6) 2. Nf3 Nc6 3. Bc4 Bc5 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.gotoPath([
          [0, 1],
          [0, 2]
        ])
        e.prev()
        expect(e.getState().currentPath).to.eql([
          [0, 1],
          [0, 1]
        ])
      })
    })
  })

  describe('annotations', () => {
    describe('for a move', () => {
      it('should have set the moves annotation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 (1. d4 Nf6 2. c4 g6) e5 2. Nf3 Nc6 3. Bb5 a6 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        expect(e.getState().prefixAnnotations! || []).eql([])
        e.setAnnotationsAtPath(null, [
          {
            type: 'TEXT',
            body: 'This is a test annotation'
          } as ChessTypes.TextAnnotation
        ])
        expect(e.getState().prefixAnnotations! || []).eql([
          { type: 'TEXT', body: 'This is a test annotation' }
        ])
      })
    })

    describe('as prefix', () => {
      it('should have set the moves annotation', () => {
        const game = PGNParser.parsePgn(
          '[White "Santhos"]\n[Black "Santhos"]\n\n1. e4 (1. d4 Nf6 2. c4 g6) e5 2. Nf3 Nc6 3. Bb5 a6 *'
        )
        const e = new GameEditor.GameEditor()
        e.setGame(game)
        e.setAnnotationsAtPath(
          [
            [0, 0],
            [0, 1]
          ],
          [
            {
              type: 'TEXT',
              body: 'This is a test annotation'
            } as ChessTypes.TextAnnotation
          ]
        )
        const annotations =
          e.getMoveAtPath([
            [0, 0],
            [0, 1]
          ])!.annotations || []
        expect(annotations).to.eql([
          { type: 'TEXT', body: 'This is a test annotation' }
        ])
      })
    })
  })
})
