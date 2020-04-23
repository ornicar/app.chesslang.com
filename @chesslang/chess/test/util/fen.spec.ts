import { expect } from 'chai'
import { Chess, Util } from '../../src/'

describe('util - fen methods', () => {
  describe('expandFen()', () => {
    it('should replace non-1s to 1s', () => {
      const FEN = 'rnbqkbnr/7p/6pp/5ppp/4pppp/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const expandedFen = Util.expandFen(FEN)
      console.log('-> expanded: ', expandedFen)
      expect(expandedFen).to.eql(
        'rnbqkbnr/1111111p/111111pp/11111ppp/1111pppp/11111111/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should replace non-1s to 1s', () => {
      const FEN =
        'rnbqkbnr/7p/6pp/2pppppp/3ppppp/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const expandedFen = Util.expandFen(FEN)
      expect(expandedFen).to.eql(
        'rnbqkbnr/1111111p/111111pp/11pppppp/111ppppp/11111111/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })
  })

  describe('compressFen()', () => {
    it('should replace 1s to non-1s', () => {
      const FEN =
        'rnbqkbnr/1111111p/111111pp/11111ppp/1111pppp/11111111/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const compressedFen = Util.compressFen(FEN)
      expect(compressedFen).to.eql(
        'rnbqkbnr/7p/6pp/5ppp/4pppp/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should replace 1s to non-1s', () => {
      const FEN =
        'rnbqkbnr/1111111p/111111pp/11pppppp/111ppppp/11111111/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const compressedFen = Util.compressFen(FEN)
      expect(compressedFen).to.eql(
        'rnbqkbnr/7p/6pp/2pppppp/3ppppp/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })
  })

  describe('placePieceOnFen()', () => {
    it('should replace the square with fen char - white', () => {
      const FEN = Util.DEFAULT_START_FEN
      const updatedFen = Util.placePieceOnFen(
        FEN,
        { type: 'q', color: 'w' },
        'a1'
      )
      expect(updatedFen).to.eql(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/QNBQKBNR w KQkq - 0 1'
      )
    })

    it('should replace the square with fen char - white', () => {
      const FEN = Util.DEFAULT_START_FEN
      const updatedFen = Util.placePieceOnFen(
        FEN,
        { type: 'q', color: 'w' },
        'a2'
      )
      expect(updatedFen).to.eql(
        'rnbqkbnr/pppppppp/8/8/8/8/QPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should replace the square with fen char - black', () => {
      const FEN = Util.DEFAULT_START_FEN
      const updatedFen = Util.placePieceOnFen(
        FEN,
        { type: 'q', color: 'b' },
        'h8'
      )
      expect(updatedFen).to.eql(
        'rnbqkbnq/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should replace the square with fen char - black', () => {
      const FEN = Util.DEFAULT_START_FEN
      const updatedFen = Util.placePieceOnFen(
        FEN,
        { type: 'n', color: 'b' },
        'e7'
      )
      expect(updatedFen).to.eql(
        'rnbqkbnr/ppppnppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })
  })

  describe('removePieceFromFen()', () => {
    it('should replace the square with 1 - white', () => {
      const FEN = Util.DEFAULT_START_FEN
      const updatedFen = Util.removePieceFromFen(FEN, 'a1')
      expect(updatedFen).to.eql(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/1NBQKBNR w KQkq - 0 1'
      )
    })

    it('should replace the square with 1 - white', () => {
      const FEN = Util.DEFAULT_START_FEN
      const updatedFen = Util.removePieceFromFen(FEN, 'a2')
      expect(updatedFen).to.eql(
        'rnbqkbnr/pppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should replace the square with 1 - black', () => {
      const FEN = Util.DEFAULT_START_FEN
      const updatedFen = Util.removePieceFromFen(FEN, 'h8')
      expect(updatedFen).to.eql(
        'rnbqkbn1/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })

    it('should replace the square with 1 - black', () => {
      const FEN = Util.DEFAULT_START_FEN
      const updatedFen = Util.removePieceFromFen(FEN, 'e7')
      expect(updatedFen).to.eql(
        'rnbqkbnr/pppp1ppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
    })
  })

  describe('getUpdatedFenWithIllegalMove()', () => {
    describe('white illegal move', () => {
      it('should have altered piece occupation', () => {
        const fen = Util.DEFAULT_START_FEN
        const updatedFen = Util.getUpdatedFenWithIllegalMove(fen, {
          from: 'a1',
          to: 'h8'
        })
        const g = new Chess(updatedFen)
        expect(g.get('a1')).to.be.null
        expect(g.get('h8')).to.eql({ type: 'r', color: 'w' })
      })

      it('should have returned the updated fen', () => {
        const fen = Util.DEFAULT_START_FEN
        const updatedFen = Util.getUpdatedFenWithIllegalMove(fen, {
          from: 'a1',
          to: 'h8'
        })
        const components = updatedFen.split(' ')
        expect(components[0]).to.eql(
          'rnbqkbnR/pppppppp/8/8/8/8/PPPPPPPP/1NBQKBNR'
        )
        expect(components[1]).to.eql('b')
        expect(components[2]).to.eql('KQkq')
        expect(components[3]).to.eql('-')
        expect(components[4]).to.eql('0')
        expect(components[5]).to.eql('1')
      })
    })

    describe('black illegal move', () => {
      it('should have altered piece occupation', () => {
        const fen = Util.DEFAULT_START_FEN.replace('w', 'b')
        const updatedFen = Util.getUpdatedFenWithIllegalMove(fen, {
          from: 'g8',
          to: 'e2'
        })
        const g = new Chess(updatedFen)
        expect(g.get('g8')).to.be.null
        expect(g.get('e2')).to.eql({ type: 'n', color: 'b' })
      })

      it('should have returned the updated fen', () => {
        const fen = Util.DEFAULT_START_FEN.replace('w', 'b')
        const updatedFen = Util.getUpdatedFenWithIllegalMove(fen, {
          from: 'g8',
          to: 'e2'
        })
        const components = updatedFen.split(' ')
        expect(components[0]).to.eql(
          'rnbqkb1r/pppppppp/8/8/8/8/PPPPnPPP/RNBQKBNR'
        )
        expect(components[1]).to.eql('w')
        expect(components[2]).to.eql('KQkq')
        expect(components[3]).to.eql('-')
        expect(components[4]).to.eql('0')
        expect(components[5]).to.eql('2')
      })
    })

    describe('update from an illegal fen', () => {
      it('should have altered piece occupation', () => {
        const fen =
          'rnbqkNnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKB1R b KQkq c6 0 2'
        const updatedFen = Util.getUpdatedFenWithIllegalMove(fen, {
          from: 'h8',
          to: 'f8'
        })
        expect(Util.getFenSquareOccupation(updatedFen, 'h8')).to.be.null
        expect(Util.getFenSquareOccupation(updatedFen, 'f8')).to.eql({
          type: 'r',
          color: 'b'
        })
      })

      it('should have returned the updated fen', () => {
        const fen =
          'rnbqkNnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKB1R b KQkq c6 0 2'
        const updatedFen = Util.getUpdatedFenWithIllegalMove(fen, {
          from: 'h8',
          to: 'f8'
        })
        const components = updatedFen.split(' ')
        expect(components[0]).to.eql(
          'rnbqkrn1/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKB1R'
        )
        expect(components[1]).to.eql('w')
        expect(components[2]).to.eql('KQkq')
        expect(components[3]).to.eql('c6')
        expect(components[4]).to.eql('0')
        expect(components[5]).to.eql('3')
      })
    })
  })
})
